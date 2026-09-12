<?php
/**
 * Plugin Name: همگام‌ساز نوشته‌های وردپرس (WP Content Sync)
 * Plugin URI: https://ais-dev-vjn7jkgeklbu4ourvrkmx6-371209738481.europe-west3.run.app
 * Description: افزونه اختصاصی برای انتقال و همگام‌سازی خودکار کلیه نوشته‌ها، تصاویر، آدرس‌ها (Slug)، دسته‌بندی‌ها و برچسب‌های وردپرس با سامانه مقصد.
 * Version: 1.0.0
 * Author: تیم توسعه وب‌سایت
 * Author URI: https://ais-dev-vjn7jkgeklbu4ourvrkmx6-371209738481.europe-west3.run.app
 * Text Domain: wp-content-sync
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WP_Site_Exporter_Sync {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance == null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('publish_post', array($this, 'auto_sync_on_publish'), 10, 2);
        add_action('wp_ajax_sync_all_posts_action', array($this, 'handle_bulk_sync_ajax'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'همگام‌سازی با سامانه',
            'همگام‌سازی سامانه',
            'manage_options',
            'wp-content-sync',
            array($this, 'render_admin_page'),
            'dashicons-cloud-upload',
            80
        );
    }

    public function register_settings() {
        register_setting('wp_sync_settings_group', 'wp_sync_target_url');
        register_setting('wp_sync_settings_group', 'wp_sync_secret_key');
        register_setting('wp_sync_settings_group', 'wp_sync_auto_publish');
    }

    public function render_admin_page() {
        $target_url = get_option('wp_sync_target_url', '');
        $secret_key = get_option('wp_sync_secret_key', 'wp_sync_' . wp_generate_password(12, false));
        $auto_publish = get_option('wp_sync_auto_publish', '1');

        if (empty(get_option('wp_sync_secret_key'))) {
            update_option('wp_sync_secret_key', $secret_key);
        }

        // Count published posts
        $count_posts = wp_count_posts('post');
        $published_count = isset($count_posts->publish) ? $count_posts->publish : 0;
        ?>
        <div class="wrap" dir="rtl" style="font-family: tahoma, sans-serif; text-align: right;">
            <h1 style="margin-bottom: 20px;">⚡ افزونه همگام‌سازی هوشمند نوشته‌های وردپرس با وب‌سایت</h1>

            <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; border-radius: 8px; margin-bottom: 20px; max-width: 800px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2>⚙️ تنظیمات اتصال به وب‌سایت مقصد</h2>
                <form method="post" action="options.php">
                    <?php settings_fields('wp_sync_settings_group'); ?>
                    <?php do_settings_sections('wp_sync_settings_group'); ?>
                    
                    <table class="form-table" style="text-align: right;">
                        <tr>
                            <th scope="row"><label for="wp_sync_target_url">آدرس Webhook سامانه مقصد:</label></th>
                            <td>
                                <input type="url" id="wp_sync_target_url" name="wp_sync_target_url" value="<?php echo esc_attr($target_url); ?>" class="regular-text" placeholder="https://yoursite.com/api/wordpress/sync" style="width: 100%; direction: ltr;" required />
                                <p class="description">آدرس وب‌سایت خود به همراه <code>/api/wordpress/sync</code> را وارد کنید.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="wp_sync_secret_key">کلید امنیتی (Secret Key):</label></th>
                            <td>
                                <input type="text" id="wp_sync_secret_key" name="wp_sync_secret_key" value="<?php echo esc_attr($secret_key); ?>" class="regular-text" style="direction: ltr;" />
                                <p class="description">کلید احراز هویت درخواست‌ها جهت امنیت همگام‌سازی.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">همگام‌سازی خودکار:</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="wp_sync_auto_publish" value="1" <?php checked('1', $auto_publish); ?> />
                                    ارسال خودکار نوشته به سایت جدید به محض انتشار یا ویرایش در وردپرس
                                </label>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('ذخیره تنظیمات اتصال'); ?>
                </form>
            </div>

            <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; border-radius: 8px; max-width: 800px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2>🚀 همگام‌سازی دسته‌جمعی کل نوشته‌ها</h2>
                <p>در حال حاضر <strong><?php echo esc_html($published_count); ?></strong> نوشته منتشر شده در این سایت وردپرسی وجود دارد.</p>
                <p>با کلیک بر روی دکمه زیر، تمام نوشته‌ها همراه با آدرس (Slug)، متن، تصویر شاخص، دسته‌بندی و برچسب‌ها به سایت جدید منتقل می‌شوند.</p>
                
                <div style="margin-top: 15px;">
                    <button id="btn-start-bulk-sync" class="button button-primary button-hero" style="background: #2271b1; border-color: #2271b1;">
                        📤 انتقال کامل کل نوشته‌ها به سایت جدید
                    </button>
                </div>

                <div id="sync-progress-box" style="display: none; margin-top: 20px; padding: 15px; background: #f0f6fc; border-right: 4px solid #72a24d; border-radius: 4px;">
                    <p id="sync-status-text" style="font-weight: bold; margin: 0 0 10px 0;">در حال آماده‌سازی و ارسال داده‌ها...</p>
                    <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                        <div id="sync-progress-bar" style="background: #2271b1; width: 0%; height: 100%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $('#btn-start-bulk-sync').on('click', function(e) {
                e.preventDefault();
                var targetUrl = $('#wp_sync_target_url').val();
                if(!targetUrl) {
                    alert('لطفا ابتدا آدرس Webhook سامانه مقصد را وارد و ذخیره کنید.');
                    return;
                }

                if(!confirm('آیا از ارسال کل نوشته‌ها به سامانه مقصد اطمینان دارید؟')) {
                    return;
                }

                $(this).prop('disabled', true);
                $('#sync-progress-box').slideDown();
                $('#sync-status-text').text('در حال دریافت نوشته‌ها از دیتابیس وردپرس...');

                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'sync_all_posts_action',
                        security: '<?php echo wp_create_nonce("wp_sync_nonce"); ?>'
                    },
                    success: function(response) {
                        if(response.success) {
                            $('#sync-progress-bar').css('width', '100%');
                            $('#sync-status-text').html('✅ ' + response.data.message);
                            alert('همگام‌سازی با موفقیت انجام شد: ' + response.data.count + ' نوشته منتقل گردید.');
                        } else {
                            $('#sync-status-text').html('❌ خطا: ' + (response.data || 'اشکال در ارسال'));
                        }
                        $('#btn-start-bulk-sync').prop('disabled', false);
                    },
                    error: function(xhr, status, error) {
                        $('#sync-status-text').html('❌ خطا در ارتباط با سرور وردپرس: ' + error);
                        $('#btn-start-bulk-sync').prop('disabled', false);
                    }
                });
            });
        });
        </script>
        <?php
    }

    public function auto_sync_on_publish($ID, $post) {
        $auto_publish = get_option('wp_sync_auto_publish', '1');
        if ($auto_publish !== '1') return;

        if (wp_is_post_revision($ID) || $post->post_status !== 'publish') {
            return;
        }

        $post_data = $this->extract_post_data($post);
        $this->send_to_target_site(array($post_data));
    }

    public function handle_bulk_sync_ajax() {
        check_ajax_referer('wp_sync_nonce', 'security');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('شما دسترسی لازم را ندارید.');
        }

        $args = array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
        );

        $posts = get_posts($args);
        $export_data = array();

        foreach ($posts as $post) {
            $export_data[] = $this->extract_post_data($post);
        }

        $result = $this->send_to_target_site($export_data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success(array(
                'message' => 'انتقال موفقیت‌آمیز بود.',
                'count'   => count($export_data)
            ));
        }
    }

    private function extract_post_data($post) {
        $categories = wp_get_post_categories($post->ID, array('fields' => 'names'));
        $tags = wp_get_post_tags($post->ID, array('fields' => 'names'));
        $thumbnail_url = get_the_post_thumbnail_url($post->ID, 'full');
        $author = get_the_author_meta('display_name', $post->post_author);

        // Get view count if WP-PostViews or meta exists
        $views = get_post_meta($post->ID, 'views', true);
        if (!$views) {
            $views = get_post_meta($post->ID, 'post_views_count', true);
        }

        return array(
            'wp_id'          => $post->ID,
            'title'          => $post->post_title,
            'slug'           => $post->post_name,
            'content'        => $post->post_content,
            'excerpt'        => $post->post_excerpt,
            'featured_image' => $thumbnail_url ? $thumbnail_url : '',
            'author_name'    => $author ? $author : 'نویسنده',
            'category_name'  => !empty($categories) ? $categories[0] : 'دسته‌بندی نشده',
            'tags'           => $tags,
            'status'         => $post->post_status === 'publish' ? 'published' : 'draft',
            'views'          => intval($views) ? intval($views) : 0,
            'published_at'   => $post->post_date_gmt ? $post->post_date_gmt : $post->post_date,
        );
    }

    private function send_to_target_site($posts_array) {
        $target_url = get_option('wp_sync_target_url', '');
        $secret_key = get_option('wp_sync_secret_key', '');

        if (empty($target_url)) {
            return new WP_Error('no_target', 'آدرس وب‌سایت مقصد تنظیم نشده است.');
        }

        $body = json_encode(array(
            'secret_key' => $secret_key,
            'posts'      => $posts_array,
        ));

        $response = wp_remote_post($target_url, array(
            'method'      => 'POST',
            'timeout'     => 45,
            'redirection' => 5,
            'httpversion' => '1.1',
            'blocking'    => true,
            'headers'     => array(
                'Content-Type'  => 'application/json; charset=utf-8',
                'X-WP-Sync-Key' => $secret_key
            ),
            'body'        => $body,
            'data_format' => 'body',
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code < 200 || $code >= 300) {
            $msg = wp_remote_retrieve_response_message($response);
            return new WP_Error('http_error', 'خطا از سمت سرور مقصد (کد ' . $code . '): ' . $msg);
        }

        return true;
    }
}

WP_Site_Exporter_Sync::get_instance();
