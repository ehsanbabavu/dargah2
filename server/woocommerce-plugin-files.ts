/**
 * Modular generators for WordPress / WooCommerce Card-to-Card Gateway Plugin
 * Generates standard, production-ready WordPress plugin files and folders.
 */

/**
 * 1. Main Plugin Entry File: blupal-card-to-card-gateway.php
 */
export function generateMainPluginPhp(serverBaseUrl: string, prefilledApiKey?: string): string {
  const safeBaseUrl = serverBaseUrl.replace(/\/$/, "");
  const defaultKey = prefilledApiKey || "";

  return `<?php
/**
 * Plugin Name: درگاه پرداخت کارت به کارت هوشمند (بلوپال)
 * Plugin URI: ${safeBaseUrl}
 * Description: افزونه درگاه پرداخت کارت به کارت خودکار ووکامرس با تایید آنی شتاب، استعلام لحظه‌ای و پیگیری سفارشات.
 * Version: 1.1.0
 * Author: سامانه پرداخت کارت به کارت
 * Author URI: ${safeBaseUrl}
 * Text Domain: wc-blupal-c2c
 * Domain Path: /languages
 * Requires at least: 5.4
 * Requires PHP: 7.2
 * WC requires at least: 4.0
 * WC tested up to: 9.2
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Plugin Constants
define('BLUPAL_C2C_VERSION', '1.1.0');
define('BLUPAL_C2C_FILE', __FILE__);
define('BLUPAL_C2C_DIR', plugin_dir_path(__FILE__));
define('BLUPAL_C2C_URL', plugin_dir_url(__FILE__));
define('BLUPAL_C2C_DEFAULT_SERVER', '${safeBaseUrl}');
define('BLUPAL_C2C_DEFAULT_API_KEY', '${defaultKey}');

// Declare compatibility with WooCommerce HPOS (Custom Order Tables) and Blocks
add_action('before_woocommerce_init', 'blupal_c2c_declare_compatibility');
function blupal_c2c_declare_compatibility() {
    if (!class_exists('\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
        return;
    }

    $features = array(
        'custom_order_tables',   // HPOS
        'cart_checkout_blocks',  // Checkout Blocks
        'analytics',
        'order_attribution',
    );

    foreach ($features as $feature_id) {
        \\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility(
            $feature_id,
            __FILE__,
            true
        );
    }
}

/**
 * Check if WooCommerce is active
 */
function blupal_c2c_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'blupal_c2c_missing_wc_notice');
        return false;
    }
    return true;
}

function blupal_c2c_missing_wc_notice() {
    echo '<div class="error"><p><strong>' . esc_html__('درگاه پرداخت کارت به کارت هوشمند:', 'wc-blupal-c2c') . '</strong> ' . esc_html__('برای استفاده از این درگاه، افزونه ووکامرس (WooCommerce) باید نصب و فعال باشد.', 'wc-blupal-c2c') . '</p></div>';
}

/**
 * Load plugin class files
 */
function blupal_c2c_load_classes() {
    if (!class_exists('Blupal_C2C_API')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-api.php';
    }
    if (!class_exists('Blupal_C2C_Webhook')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-webhook.php';
    }
    if (!class_exists('WC_Gateway_Blupal_C2C')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-wc-gateway-blupal.php';
    }
}

/**
 * Register Gateway Class with WooCommerce
 */
add_filter('woocommerce_payment_gateways', 'blupal_c2c_add_gateway_class');
function blupal_c2c_add_gateway_class($gateways) {
    if (blupal_c2c_check_woocommerce()) {
        blupal_c2c_load_classes();
        $gateways[] = 'WC_Gateway_Blupal_C2C';
    }
    return $gateways;
}

/**
 * Ensure gateway is ALWAYS active in available payment gateways list if enabled
 */
add_filter('woocommerce_available_payment_gateways', 'blupal_c2c_ensure_available_in_checkout', 9999, 1);
function blupal_c2c_ensure_available_in_checkout($available_gateways) {
    if (isset($available_gateways['blupal_c2c'])) {
        return $available_gateways;
    }

    $settings = get_option('woocommerce_blupal_c2c_settings', array());
    $is_disabled = isset($settings['enabled']) && ($settings['enabled'] === 'no' || $settings['enabled'] === '0' || $settings['enabled'] === false);

    if (!$is_disabled) {
        blupal_c2c_load_classes();
        if (class_exists('WC_Gateway_Blupal_C2C')) {
            $gateways = WC()->payment_gateways->payment_gateways();
            if (isset($gateways['blupal_c2c'])) {
                $available_gateways['blupal_c2c'] = $gateways['blupal_c2c'];
            } else {
                $available_gateways['blupal_c2c'] = new WC_Gateway_Blupal_C2C();
            }
        }
    }

    return $available_gateways;
}

/**
 * Register WooCommerce Blocks Checkout support for both classic and block checkouts
 */
add_action('woocommerce_blocks_loaded', 'blupal_c2c_register_blocks_support');
function blupal_c2c_register_blocks_support() {
    if (!class_exists('Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType')) {
        return;
    }

    require_once BLUPAL_C2C_DIR . 'includes/class-blupal-blocks-support.php';

    add_action(
        'woocommerce_blocks_payment_method_type_registration',
        'blupal_c2c_blocks_handler'
    );
}

// Also hook directly to payment method type registration for modern WC 8+ / 9+
add_action('woocommerce_blocks_payment_method_type_registration', 'blupal_c2c_blocks_handler');
function blupal_c2c_blocks_handler($payment_method_registry) {
    static $registered = false;
    if ($registered) return;
    $registered = true;

    if (class_exists('WC_Blupal_Blocks_Support')) {
        $payment_method_registry->register(new WC_Blupal_Blocks_Support());
    }
}

/**
 * Add Plugin Action Links (Settings button on Plugins page)
 */
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'blupal_c2c_action_links');
function blupal_c2c_action_links($links) {
    $settings_link = '<a href="' . esc_url(admin_url('admin.php?page=wc-settings&tab=checkout&section=blupal_c2c')) . '">' . esc_html__('پیکربندی درگاه', 'wc-blupal-c2c') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}

/**
 * Admin assets (enqueue CSS/JS for gateway settings)
 */
add_action('admin_enqueue_scripts', 'blupal_c2c_admin_assets');
function blupal_c2c_admin_assets($hook) {
    if (isset($_GET['page']) && $_GET['page'] === 'wc-settings' && isset($_GET['section']) && $_GET['section'] === 'blupal_c2c') {
        wp_enqueue_style(
            'blupal-c2c-admin-css',
            BLUPAL_C2C_URL . 'assets/css/admin.css',
            array(),
            BLUPAL_C2C_VERSION
        );
    }
}

/**
 * Global AJAX listener for live connection test from settings page
 */
add_action('wp_ajax_blupal_c2c_test_connection', 'blupal_c2c_ajax_test_connection_callback');
function blupal_c2c_ajax_test_connection_callback() {
    // Check nonce or admin capabilities
    $nonce = isset($_POST['security']) ? sanitize_text_field($_POST['security']) : '';
    if (!wp_verify_nonce($nonce, 'blupal_c2c_test_nonce')) {
        if (!current_user_can('manage_woocommerce') && !current_user_can('manage_options')) {
            wp_send_json_error(array(
                'status'  => 'nonce_failed',
                'message' => 'اعتبار نشست کاری به پایان رسیده است. لطفاً صفحه را رفرش فرمایید.',
            ));
            exit;
        }
    }

    if (!current_user_can('manage_woocommerce') && !current_user_can('manage_options')) {
        wp_send_json_error(array(
            'status'  => 'unauthorized',
            'message' => 'دسترسی غیرمجاز. فقط مدیران فروشگاه امکان بررسی اتصال را دارند.',
        ));
        exit;
    }

    $server_url = isset($_POST['server_url']) ? esc_url_raw(trim($_POST['server_url'])) : '';
    $api_key    = isset($_POST['api_key']) ? sanitize_text_field(trim($_POST['api_key'])) : '';

    if (empty($server_url)) {
        wp_send_json_error(array(
            'status'  => 'missing_url',
            'message' => 'لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات وارد نمایید.',
        ));
        exit;
    }

    if (empty($api_key)) {
        wp_send_json_error(array(
            'status'  => 'missing_key',
            'message' => 'لطفاً ابتدا کلید اختصاصی اتصال (API Key) را در کادر تنظیمات وارد نمایید.',
        ));
        exit;
    }

    blupal_c2c_load_classes();
    if (class_exists('Blupal_C2C_API')) {
        $api = new Blupal_C2C_API($server_url, $api_key);
        $result = $api->test_connection();
        if (isset($result['success']) && $result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    } else {
        wp_send_json_error(array(
            'status'  => 'class_missing',
            'message' => 'کلاس API درگاه بارگذاری نشد.',
        ));
    }
    exit;
}
`;
}

/**
 * 2. Main Gateway Class File: includes/class-wc-gateway-blupal.php
 */
export function generateGatewayClassPhp(serverBaseUrl?: string, prefilledApiKey?: string): string {
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('WC_Gateway_Blupal_C2C')) {
    class WC_Gateway_Blupal_C2C extends WC_Payment_Gateway {

        public $server_url;
        public $api_key;
        public $instructions;

        public function __construct() {
            $this->id                 = 'blupal_c2c';
            $this->icon               = BLUPAL_C2C_URL . 'assets/images/icon.svg';
            $this->has_fields         = false;
            $this->method_title       = __('پرداخت کارت به کارت هوشمند', 'wc-blupal-c2c');
            $this->method_description = __('پرداخت مستقیم به شماره کارت پذیرنده با استعلام خودکار و آنی واریزی از طریق سامانه شتاب.', 'wc-blupal-c2c');

            // Load settings
            $this->init_form_fields();
            $this->init_settings();

            // Define user configurable settings
            $this->title        = $this->get_option('title', __('پرداخت کارت به کارت هوشمند (تایید آنی)', 'wc-blupal-c2c'));
            $this->description  = $this->get_option('description', __('انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.', 'wc-blupal-c2c'));
            $this->enabled      = $this->get_option('enabled', 'yes');
            $this->server_url   = $this->get_option('server_url', BLUPAL_C2C_DEFAULT_SERVER);
            $this->api_key      = $this->get_option('api_key', BLUPAL_C2C_DEFAULT_API_KEY);

            // Hook into admin save
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));

            // AJAX action for live connection test
            add_action('wp_ajax_blupal_c2c_test_connection', array($this, 'ajax_test_connection'));

            // Webhook and Callback listener: /?wc-api=wc_blupal_c2c
            add_action('woocommerce_api_wc_blupal_c2c', array($this, 'handle_callback'));

            // Show thank you page notes
            add_action('woocommerce_thankyou_' . $this->id, array($this, 'thankyou_page'));
            
            // Show email notes
            add_action('woocommerce_email_before_order_table', array($this, 'email_instructions'), 10, 3);
        }

        /**
         * AJAX handler for live connection test from settings page
         */
        public function ajax_test_connection() {
            check_ajax_referer('blupal_c2c_test_nonce', 'security');

            if (!current_user_can('manage_woocommerce')) {
                wp_send_json_error(array('message' => __('دسترسی غیرمجاز. تنها مدیران فروشگاه امکان بررسی اتصال را دارند.', 'wc-blupal-c2c')));
            }

            $server_url = isset($_POST['server_url']) ? esc_url_raw(trim($_POST['server_url'])) : $this->server_url;
            $api_key    = isset($_POST['api_key']) ? sanitize_text_field(trim($_POST['api_key'])) : $this->api_key;

            if (empty($server_url)) {
                wp_send_json_error(array('message' => __('لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات وارد فرمایید.', 'wc-blupal-c2c')));
            }

            if (empty($api_key)) {
                wp_send_json_error(array('message' => __('لطفاً ابتدا کلید وب‌سرویس اختصاصی (API Key) را در کادر تنظیمات وارد فرمایید.', 'wc-blupal-c2c')));
            }

            $test_api = new Blupal_C2C_API($server_url, $api_key);
            $result   = $test_api->test_connection();

            if (isset($result['success']) && $result['success']) {
                wp_send_json_success($result);
            } else {
                wp_send_json_error($result);
            }
        }

        /**
         * Admin settings form fields
         */
        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array(
                    'title'   => __('فعال‌سازی درگاه', 'wc-blupal-c2c'),
                    'type'    => 'checkbox',
                    'label'   => __('فعال‌سازی پرداخت کارت به کارت هوشمند در برگه تسویه حساب', 'wc-blupal-c2c'),
                    'default' => 'yes',
                ),
                'title' => array(
                    'title'       => __('عنوان درگاه در برگه تسویه حساب', 'wc-blupal-c2c'),
                    'type'        => 'text',
                    'description' => __('عنوانی که خریدار در مرحله پرداخت مشاهده می‌کند.', 'wc-blupal-c2c'),
                    'default'     => __('پرداخت کارت به کارت هوشمند (تایید آنی)', 'wc-blupal-c2c'),
                    'desc_tip'    => true,
                ),
                'description' => array(
                    'title'       => __('توضیحات درگاه برای مشتری', 'wc-blupal-c2c'),
                    'type'        => 'textarea',
                    'description' => __('توضیحات تکمیلی که پس از انتخاب این درگاه به خریدار نمایش داده می‌شود.', 'wc-blupal-c2c'),
                    'default'     => __('انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.', 'wc-blupal-c2c'),
                    'desc_tip'    => true,
                ),
                'server_url' => array(
                    'title'       => __('آدرس وب‌سرویس / سرور پرداخت (API Base URL)', 'wc-blupal-c2c'),
                    'type'        => 'text',
                    'description' => __('دامنه یا آدرس کامل سرور صدور فاکتور و استعلام واریزی.', 'wc-blupal-c2c'),
                    'default'     => BLUPAL_C2C_DEFAULT_SERVER,
                    'desc_tip'    => true,
                ),
                'api_key' => array(
                    'title'       => __('کلید اختصاصی اتصال (API Key)', 'wc-blupal-c2c'),
                    'type'        => 'password',
                    'description' => __('کلید اختصاصی احراز هویت وب‌سرویس درگاه کارت به کارت شما.', 'wc-blupal-c2c'),
                    'default'     => BLUPAL_C2C_DEFAULT_API_KEY,
                    'desc_tip'    => true,
                ),
            );
        }

        /**
         * Custom Admin Options Page Output
         */
        public function admin_options() {
            ?>
            <div class="blupal-c2c-admin-wrapper">
                <div class="blupal-c2c-admin-header">
                    <div class="blupal-c2c-badge">نسخه ۱.۱.۰</div>
                    <h2>💳 تنظیمات درگاه پرداخت کارت به کارت هوشمند (بلوپال)</h2>
                    <p>درگاه اختصاصی انتقال وجه کارت به کارت با الگوریتم هوشمند پردازش و تایید خودکار واریزی‌های شتابی.</p>
                </div>

                <div class="blupal-c2c-status-card">
                    <div class="blupal-c2c-status-info">
                        <div class="blupal-c2c-status-icon">⚡</div>
                        <div>
                            <h4>وضعیت اتصال به سامانه پرداخت</h4>
                            <p id="blupal-connection-msg">برای سنجش برقرار بودن ارتباط با سرور صدور فاکتور، روی دکمه برقراری آزمایشی اتصال کلیک کنید.</p>
                        </div>
                    </div>
                    <button type="button" id="blupal-test-btn" class="button button-secondary blupal-c2c-btn-test">
                        🔍 بررسی و تست آنلاین اتصال
                    </button>
                </div>

                <table class="form-table">
                    <?php $this->generate_settings_html(); ?>
                </table>
            </div>

            <script>
            jQuery(document).ready(function($) {
                $('#blupal-test-btn').on('click', function(e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var $msg = $('#blupal-connection-msg');
                    
                    var serverUrl = $('#woocommerce_blupal_c2c_server_url').val();
                    var apiKey = $('#woocommerce_blupal_c2c_api_key').val();

                    $btn.prop('disabled', true).text('⏳ در حال برقراری ارتباط...');
                    $msg.css('color', '#6b7280').text('در حال ارسال درخواست تست به سرور...');

                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'blupal_c2c_test_connection',
                            security: '<?php echo wp_create_nonce("blupal_c2c_test_nonce"); ?>',
                            server_url: serverUrl,
                            api_key: apiKey
                        },
                        success: function(response) {
                            $btn.prop('disabled', false).text('🔍 بررسی و تست آنلاین اتصال');
                            if (response.success) {
                                $msg.css('color', '#059669').html('✅ <strong>اتصال موفقیت‌آمیز بود!</strong> ' + (response.data.message || 'سرور آماده پذیرش تراکنش‌هاست.'));
                            } else {
                                var errorText = response.data && response.data.message ? response.data.message : 'خطا در برقراری ارتباط';
                                $msg.css('color', '#dc2626').html('❌ <strong>خطا در اتصال:</strong> ' + errorText);
                            }
                        },
                        error: function(xhr, status, error) {
                            $btn.prop('disabled', false).text('🔍 بررسی و تست آنلاین اتصال');
                            $msg.css('color', '#dc2626').html('❌ <strong>خطای شبکه:</strong> عدم دریافت پاسخ صحیح از سرور (' + status + ')');
                        }
                    });
                });
            });
            </script>
            <?php
        }

        /**
         * Process Checkout Payment Redirect
         */
        public function process_payment($order_id) {
            $order = wc_get_order($order_id);

            if (!$order) {
                wc_add_notice(__('سفارش مورد نظر یافت نشد.', 'wc-blupal-c2c'), 'error');
                return array('result' => 'failure');
            }

            if (empty($this->server_url) || empty($this->api_key)) {
                wc_add_notice(__('کلید درگاه کارت به کارت در تنظیمات ووکامرس پیکربندی نشده است.', 'wc-blupal-c2c'), 'error');
                return array('result' => 'failure');
            }

            $api = new Blupal_C2C_API($this->server_url, $this->api_key);

            // Get amount in Tomans (convert from Rials if store currency is IRR)
            $amount = $order->get_total();
            $currency = get_woocommerce_currency();
            
            if ($currency === 'IRR') {
                $amount_toman = round($amount / 10);
            } else {
                $amount_toman = round($amount);
            }

            // Customer details
            $payer_name  = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
            $payer_phone = $order->get_billing_phone();
            $payer_email = $order->get_billing_email();

            // Callback URL upon user return
            $callback_url = add_query_arg(array(
                'wc-api'   => 'wc_blupal_c2c',
                'order_id' => $order_id
            ), home_url('/'));

            $result = $api->create_order(array(
                'order_id'     => (string)$order_id,
                'amount_toman' => $amount_toman,
                'payer_name'   => $payer_name,
                'payer_phone'  => $payer_phone,
                'payer_email'  => $payer_email,
                'callback_url' => $callback_url,
                'description'  => sprintf('پرداخت سفارش شماره %s در فروشگاه', $order->get_order_number()),
            ));

            if (!$result || !isset($result['success']) || !$result['success']) {
                $error_msg = isset($result['message']) ? $result['message'] : __('خطا در صدور فاکتور پرداخت.', 'wc-blupal-c2c');
                wc_add_notice($error_msg, 'error');
                return array('result' => 'failure');
            }

            // Save Invoice ID in order meta
            if (!empty($result['invoice_id'])) {
                $order->update_meta_data('_blupal_c2c_invoice_id', sanitize_text_field($result['invoice_id']));
                $order->save();
            }

            // Redirect customer to secure payment page
            return array(
                'result'   => 'success',
                'redirect' => $result['payment_url']
            );
        }

        /**
         * Check if payment gateway is available at checkout
         */
        public function is_available() {
            $enabled = $this->get_option('enabled', 'yes');
            if ($enabled === 'no' || $enabled === '0' || $enabled === false) {
                return false;
            }

            return true;
        }

        /**
         * Ensure gateway is valid for use regardless of store currency settings
         */
        public function is_valid_for_use() {
            return true;
        }

        /**
         * Handle callback & Webhook verification from payment server
         */
        public function handle_callback() {
            $api = new Blupal_C2C_API($this->server_url, $this->api_key);
            Blupal_C2C_Webhook::handle($this, $api);
        }

        /**
         * Custom instructions on Thank You page
         */
        public function thankyou_page($order_id) {
            $order = wc_get_order($order_id);
            if ($order && $order->is_paid()) {
                echo '<div class="woocommerce-message" style="margin-top:20px;">' . esc_html__('پرداخت شما با موفقیت تایید شد. سفارش شما در حال پردازش می‌باشد.', 'wc-blupal-c2c') . '</div>';
            }
        }

        /**
         * Custom instructions in email
         */
        public function email_instructions($order, $sent_to_admin, $plain_text = false) {
            if ($order->get_payment_method() === $this->id && $order->is_paid()) {
                echo '<p><strong>' . esc_html__('پرداخت کارت به کارت هوشمند:', 'wc-blupal-c2c') . '</strong> ' . esc_html__('تراکنش با موفقیت تایید و در سیستم ثبت شد.', 'wc-blupal-c2c') . '</p>';
            }
        }
    }
}
`;
}

/**
 * 3. API Communication Class File: includes/class-blupal-api.php
 */
export function generateApiClientPhp(): string {
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Blupal_C2C_API')) {
    class Blupal_C2C_API {

        private $server_url;
        private $api_key;

        public function __construct($server_url, $api_key) {
            $this->server_url = rtrim(trim($server_url), '/');
            $this->api_key    = trim($api_key);
        }

        /**
         * Create order / invoice on payment server
         */
        public function create_order($data) {
            $endpoint = $this->server_url . '/api/blupal/create-gateway-invoice';

            $payload = array(
                'api_key'      => $this->api_key,
                'order_id'     => $data['order_id'],
                'amount_toman' => (int)$data['amount_toman'],
                'payer_name'   => $data['payer_name'],
                'payer_phone'  => $data['payer_phone'],
                'payer_email'  => $data['payer_email'],
                'callback_url' => $data['callback_url'],
                'description'  => $data['description'],
            );

            $response = wp_remote_post($endpoint, array(
                'method'      => 'POST',
                'timeout'     => 25,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking'    => true,
                'headers'     => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ),
                'body'        => json_encode($payload),
                'sslverify'   => false,
            ));

            if (is_wp_error($response)) {
                return array(
                    'success' => false,
                    'message' => 'خطای ارتباط با سرور: ' . $response->get_error_message()
                );
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            $code = wp_remote_retrieve_response_code($response);

            if ($code !== 200 || !isset($data['success']) || !$data['success']) {
                $msg = isset($data['message']) ? $data['message'] : 'خطا در صدور فاکتور پرداخت';
                return array('success' => false, 'message' => $msg);
            }

            return $data;
        }

        /**
         * Verify payment status with payment server
         */
        public function verify_order($order_id, $invoice_id) {
            $endpoint = $this->server_url . '/api/blupal/verify-gateway-invoice';

            $payload = array(
                'api_key'    => $this->api_key,
                'order_id'   => (string)$order_id,
                'invoice_id' => (string)$invoice_id,
            );

            $response = wp_remote_post($endpoint, array(
                'method'      => 'POST',
                'timeout'     => 20,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking'    => true,
                'headers'     => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ),
                'body'        => json_encode($payload),
                'sslverify'   => false,
            ));

            if (is_wp_error($response)) {
                return array('success' => false, 'message' => $response->get_error_message());
            }

            $body = wp_remote_retrieve_body($response);
            return json_decode($body, true);
        }

        /**
         * Test live connection to payment server
         */
        public function test_connection() {
            $endpoint = $this->server_url . '/api/blupal/test-connection';
            $site_url = home_url('/');

            $response = wp_remote_post($endpoint, array(
                'method'      => 'POST',
                'timeout'     => 15,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking'    => true,
                'headers'     => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ),
                'body'        => json_encode(array(
                    'api_key'    => $this->api_key,
                    'site_url'   => $site_url,
                    'domain'     => preg_replace('/^https?:\/\//i', '', $site_url),
                    'wp_version' => get_bloginfo('version'),
                    'wc_version' => defined('WC_VERSION') ? WC_VERSION : 'unknown',
                )),
                'sslverify'   => false,
            ));

            if (is_wp_error($response)) {
                return array('success' => false, 'message' => $response->get_error_message());
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (is_array($data)) {
                return $data;
            }

            return array(
                'success' => false,
                'message' => 'پاسخ دریافتی فرمت JSON معتبر ندارد. وضعیت کد HTTP: ' . wp_remote_retrieve_response_code($response)
            );
        }
    }
}
`;
}

/**
 * 4. Webhook / Callback Handler Class File: includes/class-blupal-webhook.php
 */
export function generateWebhookPhp(): string {
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Blupal_C2C_Webhook')) {
    class Blupal_C2C_Webhook {
        public static function handle($gateway, $api) {
            // Read parameters from GET/POST and JSON body
            $order_id   = isset($_REQUEST['order_id']) ? sanitize_text_field($_REQUEST['order_id']) : '';
            $invoice_id = isset($_REQUEST['invoice_id']) ? sanitize_text_field($_REQUEST['invoice_id']) : '';

            $raw_input = file_get_contents('php://input');
            if (!empty($raw_input)) {
                $json = json_decode($raw_input, true);
                if (is_array($json)) {
                    if (empty($order_id) && isset($json['order_id'])) {
                        $order_id = sanitize_text_field($json['order_id']);
                    }
                    if (empty($invoice_id) && isset($json['invoice_id'])) {
                        $invoice_id = sanitize_text_field($json['invoice_id']);
                    }
                }
            }

            if (empty($order_id)) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('message' => 'شناسه سفارش نامعتبر است.'), 400);
                    exit;
                }
                wp_die(__('شناسه سفارش نامعتبر است.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'));
            }

            $order = wc_get_order($order_id);
            if (!$order) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('message' => 'سفارش مورد نظر یافت نشد.'), 404);
                    exit;
                }
                wp_die(__('سفارش مورد نظر یافت نشد.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'));
            }

            // If already paid, exit gracefully
            if ($order->is_paid()) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_success(array('order_id' => $order_id, 'status' => 'already_paid'));
                    exit;
                }
                wp_redirect($gateway->get_return_url($order));
                exit;
            }

            // Query payment status from server
            $data = $api->verify_order($order_id, $invoice_id);

            if (!$data || !isset($data['success']) || !$data['success']) {
                $order->add_order_note(__('خطا در استعلام وضعیت پرداخت از سرور کارت به کارت: ', 'wc-blupal-c2c') . (isset($data['message']) ? $data['message'] : 'عدم پاسخگویی'));
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('message' => 'خطا در ارتباط با سرور تایید'));
                    exit;
                }
                wc_add_notice(__('خطا در اعتبارسنجی پرداخت. در صورت کسر وجه با پشتیبانی تماس بگیرید.', 'wc-blupal-c2c'), 'error');
                wp_redirect(wc_get_checkout_url());
                exit;
            }

            if (isset($data['status']) && $data['status'] === 'paid') {
                $tracking_code = isset($data['tracking_code']) ? sanitize_text_field($data['tracking_code']) : 'ثبت شده';

                if (!$order->is_paid()) {
                    $order->payment_complete($tracking_code);
                    $order->add_order_note(sprintf(
                        __('پرداخت کارت به کارت با موفقیت تایید شد. کد رهگیری شتاب: %s | شناسه فاکتور: %s', 'wc-blupal-c2c'),
                        $tracking_code,
                        $invoice_id
                    ));
                    if (!empty($data['card_last_four'])) {
                        $order->add_order_note(sprintf(__('۴ رقم آخر کارت واریزکننده: %s', 'wc-blupal-c2c'), sanitize_text_field($data['card_last_four'])));
                    }
                    wc_reduce_stock($order_id);
                }

                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_success(array('order_id' => $order_id, 'status' => 'completed'));
                    exit;
                }

                wp_redirect($gateway->get_return_url($order));
                exit;
            } else {
                $order->update_status('failed', __('پرداخت کارت به کارت تایید نشد یا منقضی گردید.', 'wc-blupal-c2c'));

                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('order_id' => $order_id, 'status' => 'failed'));
                    exit;
                }

                wc_add_notice(__('پرداخت کارت به کارت تایید نشد یا زمان واریز به پایان رسید. لطفاً مجدداً تلاش فرمایید.', 'wc-blupal-c2c'), 'error');
                wp_redirect(wc_get_checkout_url());
                exit;
            }
        }
    }
}
`;
}

/**
 * 5. WooCommerce Blocks Support Class File: includes/class-blupal-blocks-support.php
 */
export function generateBlocksSupportPhp(): string {
  return `<?php
use Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType;

if (!defined('ABSPATH')) {
    exit;
}

final class WC_Blupal_Blocks_Support extends AbstractPaymentMethodType {

    protected $name = 'blupal_c2c';

    public function initialize() {
        $this->settings = get_option('woocommerce_blupal_c2c_settings', array());
    }

    public function is_active() {
        return filter_var($this->get_setting('enabled', true), FILTER_VALIDATE_BOOLEAN);
    }

    public function get_payment_method_script_handles() {
        wp_register_script(
            'blupal-c2c-blocks-integration',
            BLUPAL_C2C_URL . 'assets/js/blocks.js',
            array(),
            BLUPAL_C2C_VERSION,
            true
        );
        return array('blupal-c2c-blocks-integration');
    }

    public function get_payment_method_data() {
        return array(
            'title'       => $this->get_setting('title', 'پرداخت کارت به کارت هوشمند (تایید آنی)'),
            'description' => $this->get_setting('description', 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.'),
            'supports'    => array('products'),
            'icon'        => BLUPAL_C2C_URL . 'assets/images/icon.svg',
        );
    }
}
`;
}

/**
 * 6. Admin Stylesheet File: assets/css/admin.css
 */
export function generateAdminCss(): string {
  return `/* Blupal WooCommerce Gateway Admin Styles */
.blupal-c2c-admin-wrapper {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 28px;
    margin-top: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    direction: rtl;
    text-align: right;
    font-family: iransans, tahoma, sans-serif;
}

.blupal-c2c-admin-header {
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 20px;
    margin-bottom: 24px;
    position: relative;
}

.blupal-c2c-admin-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
}

.blupal-c2c-admin-header p {
    color: #6b7280;
    font-size: 13px;
    margin: 0;
}

.blupal-c2c-badge {
    position: absolute;
    left: 0;
    top: 0;
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
}

.blupal-c2c-status-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 18px 24px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.blupal-c2c-status-info {
    display: flex;
    align-items: center;
    gap: 14px;
}

.blupal-c2c-status-icon {
    width: 44px;
    height: 44px;
    background: #fef3c7;
    color: #d97706;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.blupal-c2c-status-info h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
}

.blupal-c2c-status-info p {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
}

.blupal-c2c-btn-test {
    background-color: #2563eb !important;
    color: #ffffff !important;
    border-color: #1d4ed8 !important;
    border-radius: 8px !important;
    padding: 6px 18px !important;
    font-weight: 600 !important;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.blupal-c2c-btn-test:hover {
    background-color: #1d4ed8 !important;
}

.blupal-c2c-btn-test:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
`;
}

/**
 * 7. WooCommerce Blocks JavaScript File: assets/js/blocks.js
 */
export function generateBlocksJs(): string {
  return `(function () {
    if (!window.wc || !window.wc.wcBlocksRegistry) {
        return;
    }

    const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
    const { getSetting } = window.wc.wcSettings;
    const createElement = window.wp ? window.wp.element.createElement : null;

    const settings = getSetting('blupal_c2c_data', {});
    const defaultLabel = 'پرداخت کارت به کارت هوشمند (تایید آنی)';

    const label = settings.title || defaultLabel;
    const description = settings.description || 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.';

    const Content = function () {
        if (!createElement) return description;
        return createElement(
            'div',
            { className: 'wc-block-components-payment-method-description' },
            description
        );
    };

    const Label = function () {
        if (!createElement) return label;
        return createElement('span', null, label);
    };

    registerPaymentMethod({
        name: 'blupal_c2c',
        label: createElement ? createElement(Label, null) : label,
        content: createElement ? createElement(Content, null) : description,
        edit: createElement ? createElement(Content, null) : description,
        canMakePayment: function () {
            return true;
        },
        ariaLabel: label,
        supports: {
            features: settings.supports || ['products'],
        },
    });
})();
`;
}

/**
 * 8. SVG Gateway Icon: assets/images/icon.svg
 */
export function generateIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#2563EB"/>
    <path d="M2 9h20" stroke="#FFFFFF" stroke-width="2"/>
    <rect x="5" y="13" width="4" height="3" rx="1" fill="#F59E0B"/>
    <circle cx="17" cy="14.5" r="1.5" fill="#FFFFFF"/>
</svg>`;
}

/**
 * 9. Translation POT File: languages/wc-blupal-c2c.pot
 */
export function generatePotFile(): string {
  return `msgid ""
msgstr ""
"Project-Id-Version: Blupal Card to Card Gateway 1.1.0\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: 2026-09-09 22:00+0000\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: \\n"
"Language-Team: \\n"
"Language: fa_IR\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: Poedit 3.0\\n"

msgid "پرداخت کارت به کارت هوشمند"
msgstr ""

msgid "پرداخت کارت به کارت هوشمند (تایید آنی)"
msgstr ""

msgid "کلید اختصاصی اتصال (API Key)"
msgstr ""
`;
}

/**
 * 10. Readme File: readme.txt
 */
export function generateReadmeTxt(): string {
  return `=== درگاه پرداخت کارت به کارت هوشمند (بلوپال) ===
Contributors: blupal
Tags: woocommerce, payment gateway, card to card, iran, shetab
Requires at least: 5.4
Tested up to: 6.7
Requires PHP: 7.2
Stable tag: 1.1.0
License: GPLv2 or later

افزونه رسمی درگاه پرداخت کارت به کارت هوشمند ووکامرس با تایید لحظه‌ای و آنی تراکنش‌های شتاب.

== توضیحات ==
این افزونه بستری امن و هوشمند را برای فروشگاه‌های اینترنتی ووکامرسی فراهم می‌کند تا خریداران بتوانند بدون نیاز به درگاه‌های شاپرکی و کارمزد اضافی، مبلغ سفارش را به صورت کارت به کارت پرداخت نموده و سفارش خود را فوراً ثبت نمایند.

امکانات برجسته:
* تایید خودکار و اتوماتیک تراکنش به محض واریز کارت به کارت
* استعلام هوشمند کد رهگیری و شماره کارت واریزکننده
* پشتیبانی کامل از جدول سفارشی سفارشات ووکامرس (HPOS)
* سازگاری کامل با صفحه تسویه حساب جدید و بلوکی ووکامرس (Checkout Blocks)
* ابزار لایو تست اتصال شبکه در صفحه تنظیمات مدیر
* رابط کاربری کاملاً راست‌چین و مدرن

== نصب ==
۱. فایل ZIP افزونه را از بخش افزودن افزونه در پیشخوان وردپرس بارگذاری و فعال کنید.
۲. به مسیر ووکامرس > پیکربندی > زبانه پرداخت‌ها > پرداخت کارت به کارت هوشمند بروید.
۳. کلید API و آدرس سرور خود را وارد کرده و دکمه بررسی اتصال را فشار دهید.
۴. تنظیمات را ذخیره کنید.

== ساختار فایل‌ها و پوشه‌ها ==
blupal-card-to-card-gateway/
├── blupal-card-to-card-gateway.php   (فایل اصلی ورود افزونه)
├── readme.txt                        (توضیحات و مستندات افزونه)
├── includes/
│   ├── class-wc-gateway-blupal.php   (کلاس اصلی درگاه ووکامرس)
│   ├── class-blupal-api.php          (ارتباط با وب‌سرویس صدور فاکتور و استعلام)
│   └── class-blupal-webhook.php      (پردازش تایید بازگشت و وب‌هوک سفارش)
├── assets/
│   ├── css/
│   │   └── admin.css                 (استایل‌های پیشخوان ووکامرس)
│   └── images/
│       └── icon.svg                  (آیکون کارت درگاه در برگه تسویه)
├── languages/
│   └── wc-blupal-c2c.pot             (فایل الگوی ترجمه)

== تغییرات ==
= 1.1.0 =
* اضافه شدن پشتیبانی از WooCommerce HPOS و Checkout Blocks
* بهینه‌سازی سیستم استعلام لحظه‌ای و Callback
`;
}
