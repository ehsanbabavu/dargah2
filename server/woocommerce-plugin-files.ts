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

// Declare compatibility with WooCommerce HPOS (Custom Order Tables), Blocks, and New Product Editor
add_action('before_woocommerce_init', 'blupal_c2c_declare_compatibility');
function blupal_c2c_declare_compatibility() {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('product_block_editor', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('analytics', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('order_attribution', __FILE__, true);
    }
}

// Ensure default settings are initialized so gateway is enabled out of the box
add_action('init', 'blupal_c2c_ensure_default_settings');
register_activation_hook(__FILE__, 'blupal_c2c_ensure_default_settings');
function blupal_c2c_ensure_default_settings() {
    $existing = get_option('woocommerce_blupal_c2c_settings');
    $default_server = defined('BLUPAL_C2C_DEFAULT_SERVER') ? BLUPAL_C2C_DEFAULT_SERVER : '${safeBaseUrl}';
    $default_key = defined('BLUPAL_C2C_DEFAULT_API_KEY') ? BLUPAL_C2C_DEFAULT_API_KEY : '';

    if (empty($existing) || !is_array($existing)) {
        update_option('woocommerce_blupal_c2c_settings', array(
            'enabled'     => 'yes',
            'title'       => 'پرداخت کارت به کارت هوشمند (تایید آنی)',
            'description' => 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.',
            'server_url'  => $default_server,
            'api_key'     => $default_key,
        ));
    } else {
        $updated = false;
        if (!isset($existing['enabled']) || empty($existing['enabled'])) {
            $existing['enabled'] = 'yes';
            $updated = true;
        }
        if (empty($existing['server_url'])) {
            $existing['server_url'] = $default_server;
            $updated = true;
        }
        if ($updated) {
            update_option('woocommerce_blupal_c2c_settings', $existing);
        }
    }
}

// Bootstrap plugin components on plugins_loaded hook with priority 11 (after WooCommerce loads at 10)
add_action('plugins_loaded', 'blupal_c2c_init_plugin', 11);
function blupal_c2c_init_plugin() {
    if (!class_exists('WC_Payment_Gateway')) {
        add_action('admin_notices', 'blupal_c2c_missing_wc_notice');
        return;
    }

    blupal_c2c_load_classes();
}

/**
 * Load gateway classes safely
 */
function blupal_c2c_load_classes() {
    if (!class_exists('WC_Gateway_Blupal_C2C') && class_exists('WC_Payment_Gateway')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-api.php';
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-webhook.php';
        require_once BLUPAL_C2C_DIR . 'includes/class-wc-gateway-blupal.php';
    }
}

/**
 * Register gateway class into WooCommerce globally
 */
add_filter('woocommerce_payment_gateways', 'blupal_c2c_register_gateway', 10);
function blupal_c2c_register_gateway($methods) {
    blupal_c2c_load_classes();
    if (!in_array('WC_Gateway_Blupal_C2C', $methods)) {
        $methods[] = 'WC_Gateway_Blupal_C2C';
    }
    return $methods;
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
    if ($registered) {
        return;
    }

    if (class_exists('Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-blocks-support.php';
        if (class_exists('WC_Blupal_Blocks_Support') && is_object($payment_method_registry) && method_exists($payment_method_registry, 'register')) {
            $payment_method_registry->register(new WC_Blupal_Blocks_Support());
            $registered = true;
        }
    }
}

/**
 * Enqueue frontend block assets on checkout and cart pages as additional guarantee
 */
add_action('wp_enqueue_scripts', 'blupal_c2c_enqueue_frontend_scripts');
function blupal_c2c_enqueue_frontend_scripts() {
    if (function_exists('is_checkout') && is_checkout()) {
        wp_enqueue_script(
            'blupal-c2c-blocks-integration',
            BLUPAL_C2C_URL . 'assets/js/blocks.js',
            array('jquery'),
            BLUPAL_C2C_VERSION,
            true
        );

        $settings = get_option('woocommerce_blupal_c2c_settings', array());
        $title = !empty($settings['title']) ? $settings['title'] : 'پرداخت کارت به کارت هوشمند (تایید آنی)';
        $description = !empty($settings['description']) ? $settings['description'] : 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.';

        wp_localize_script('blupal-c2c-blocks-integration', 'blupalC2cConfig', array(
            'title'       => $title,
            'description' => $description,
            'icon'        => BLUPAL_C2C_URL . 'assets/images/icon.svg',
            'enabled'     => (!isset($settings['enabled']) || $settings['enabled'] !== 'no'),
        ));
    }
}

/**
 * Notice if WooCommerce is not active
 */
function blupal_c2c_missing_wc_notice() {
    ?>
    <div class="notice notice-error is-dismissible">
        <p><strong><?php esc_html_e('درگاه پرداخت کارت به کارت هوشمند:', 'wc-blupal-c2c'); ?></strong> <?php esc_html_e('برای استفاده از این درگاه، افزونه ووکامرس (WooCommerce) باید نصب و فعال باشد.', 'wc-blupal-c2c'); ?></p>
    </div>
    <?php
}

/**
 * Add settings shortcut link to WordPress Plugins page
 */
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'blupal_c2c_settings_action_link');
function blupal_c2c_settings_action_link($links) {
    $settings_url = admin_url('admin.php?page=wc-settings&tab=checkout&section=blupal_c2c');
    $action_links = array(
        'settings' => '<a href="' . esc_url($settings_url) . '">' . esc_html__('پیکربندی درگاه', 'wc-blupal-c2c') . '</a>',
    );
    return array_merge($action_links, $links);
}

/**
 * Global AJAX handler for live connection test from settings page
 * Hooked at root level so admin-ajax.php always recognizes this action
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

    blupal_c2c_load_classes();

    if (!class_exists('Blupal_C2C_API')) {
        require_once BLUPAL_C2C_DIR . 'includes/class-blupal-api.php';
    }

    $server_url = isset($_POST['server_url']) ? esc_url_raw(trim($_POST['server_url'])) : '';
    $api_key    = isset($_POST['api_key']) ? sanitize_text_field(trim($_POST['api_key'])) : '';

    if (empty($server_url)) {
        $settings = get_option('woocommerce_blupal_c2c_settings', array());
        $server_url = !empty($settings['server_url']) ? $settings['server_url'] : BLUPAL_C2C_DEFAULT_SERVER;
    }

    if (empty($api_key)) {
        $settings = get_option('woocommerce_blupal_c2c_settings', array());
        $api_key = !empty($settings['api_key']) ? $settings['api_key'] : BLUPAL_C2C_DEFAULT_API_KEY;
    }

    if (empty($server_url)) {
        wp_send_json_error(array(
            'status'  => 'missing_server_url',
            'message' => 'لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات وارد نمایید.',
        ));
        exit;
    }

    if (empty($api_key)) {
        wp_send_json_error(array(
            'status'  => 'missing_api_key',
            'message' => 'لطفاً ابتدا کلید اختصاصی اتصال (API Key) را در کادر تنظیمات وارد نمایید.',
        ));
        exit;
    }

    $test_api = new Blupal_C2C_API($server_url, $api_key);
    $result   = $test_api->test_connection();

    if (isset($result['success']) && $result['success']) {
        wp_send_json_success($result);
    } else {
        wp_send_json_error($result);
    }
    exit;
}
`;
}

/**
 * 2. Gateway Class File: includes/class-wc-gateway-blupal.php
 */
export function generateGatewayClassPhp(serverBaseUrl: string, prefilledApiKey?: string): string {
  const safeBaseUrl = serverBaseUrl.replace(/\/$/, "");
  const defaultKey = prefilledApiKey || "";

  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

require_once dirname(__FILE__) . '/class-blupal-api.php';
require_once dirname(__FILE__) . '/class-blupal-webhook.php';

if (!class_exists('WC_Gateway_Blupal_C2C') && class_exists('WC_Payment_Gateway')) {
    class WC_Gateway_Blupal_C2C extends WC_Payment_Gateway {
        public $api_key;
        public $server_url;
        private $api;

        public function __construct() {
            $this->id                 = 'blupal_c2c';
            $this->icon               = apply_filters('woocommerce_blupal_c2c_icon', BLUPAL_C2C_URL . 'assets/images/icon.svg');
            $this->has_fields         = false;
            $this->supports           = array('products');
            $this->method_title       = __('پرداخت کارت به کارت هوشمند', 'wc-blupal-c2c');
            $this->method_description = __('پرداخت مستقیم به شماره کارت پذیرنده با استعلام خودکار و آنی واریزی از طریق سامانه شتاب.', 'wc-blupal-c2c');

            // Initialize form fields and settings
            $this->init_form_fields();
            $this->init_settings();

            // Options
            $this->enabled     = $this->get_option('enabled', 'yes');
            $this->title       = $this->get_option('title', __('پرداخت کارت به کارت هوشمند (تایید آنی)', 'wc-blupal-c2c'));
            $this->description = $this->get_option('description', __('جهت پرداخت، اطلاعات سفارش به صفحه پرداخت امن هدایت شده و پس از انتقال کارت به کارت، سفارش شما به صورت آنی تایید می‌گردد.', 'wc-blupal-c2c'));
            $this->server_url  = rtrim($this->get_option('server_url', defined('BLUPAL_C2C_DEFAULT_SERVER') ? BLUPAL_C2C_DEFAULT_SERVER : '${safeBaseUrl}'), '/');
            $this->api_key     = trim($this->get_option('api_key', defined('BLUPAL_C2C_DEFAULT_API_KEY') ? BLUPAL_C2C_DEFAULT_API_KEY : '${defaultKey}'));

            // Fallback for server url if left empty
            if (empty($this->server_url)) {
                $this->server_url = '${safeBaseUrl}';
            }

            // Initialize API Client
            $this->api = new Blupal_C2C_API($this->server_url, $this->api_key);

            // Hook into admin save
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));

            // AJAX action for live connection test
            add_action('wp_ajax_blupal_c2c_test_connection', array($this, 'ajax_test_connection'));

            // Webhook and Callback listener: /?wc-api=wc_blupal_c2c
            add_action('woocommerce_api_wc_blupal_c2c', array($this, 'handle_callback'));

            // Enqueue admin assets on our settings page
            add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        }

        /**
         * Enqueue admin stylesheets
         */
        public function enqueue_admin_assets() {
            if (isset($_GET['section']) && $_GET['section'] === $this->id) {
                wp_enqueue_style(
                    'blupal-c2c-admin',
                    BLUPAL_C2C_URL . 'assets/css/admin.css',
                    array(),
                    BLUPAL_C2C_VERSION
                );
            }
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
            $site_host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field($_SERVER['HTTP_HOST']) : '';
            $clean_host = preg_replace('/^www\\./i', '', $site_host);

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
                    'description' => __('توضیحاتی که پس از انتخاب این گزینه در صفحه پرداخت نمایش داده می‌شود.', 'wc-blupal-c2c'),
                    'default'     => __('انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.', 'wc-blupal-c2c'),
                ),
                'server_url' => array(
                    'title'       => __('آدرس وب‌سرویس / سرور پرداخت (API Base URL)', 'wc-blupal-c2c'),
                    'type'        => 'text',
                    'description' => sprintf(
                        __('آدرس سرور یا دامنه سامانه پرداخت بلوپال بدون اسلش پایانی. پیش‌فرض: <strong dir="ltr">%s</strong>', 'wc-blupal-c2c'),
                        esc_html('${safeBaseUrl}')
                    ),
                    'default'     => defined('BLUPAL_C2C_DEFAULT_SERVER') ? BLUPAL_C2C_DEFAULT_SERVER : '${safeBaseUrl}',
                    'placeholder' => '${safeBaseUrl}',
                ),
                'api_key' => array(
                    'title'       => __('کلید اختصاصی اتصال (API Key)', 'wc-blupal-c2c'),
                    'type'        => 'text',
                    'description' => sprintf(
                        __('کلید وب‌سرویس اختصاصی صادر شده در پنل کاربری شما. دامنه این سایت: <strong dir="ltr">%s</strong> (حتماً در پنل درگاه ثبت شود).', 'wc-blupal-c2c'),
                        esc_html($clean_host)
                    ),
                    'default'     => defined('BLUPAL_C2C_DEFAULT_API_KEY') ? BLUPAL_C2C_DEFAULT_API_KEY : '${defaultKey}',
                    'placeholder' => 'Rakhsh_Pay_...',
                ),
            );
        }

        /**
         * Render admin options page with Live Test Connection Tool
         */
        public function admin_options() {
            $site_host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field($_SERVER['HTTP_HOST']) : '';
            $clean_host = preg_replace('/^www\\./i', '', $site_host);
            $test_nonce = wp_create_nonce('blupal_c2c_test_nonce');
            ?>
            <h2><?php echo esc_html($this->method_title); ?></h2>

            <!-- Live Test Connection Box -->
            <div class="blupal-c2c-test-box">
                <div class="blupal-test-header">
                    <div class="blupal-test-title">
                        <span class="blupal-test-icon">⚡</span>
                        <div>
                            <strong>ابزار تست زنده اتصال و عیب‌یابی وب‌سرویس</strong>
                            <p>با کلیک روی دکمه زیر، ارتباط زنده با سرور و صحت کلید API سایت شما بررسی و نتیجه آنی گزارش می‌شود.</p>
                        </div>
                    </div>
                    <button type="button" id="blupal-btn-test-connection" class="button button-primary blupal-btn-test">
                        <span class="blupal-btn-text">بررسی و تست اتصال به سرور</span>
                        <span class="blupal-spinner" style="display: none;"></span>
                    </button>
                </div>

                <div id="blupal-test-result" class="blupal-test-result" style="display: none;"></div>
            </div>

            <div class="blupal-c2c-banner">
                <div class="blupal-c2c-banner-header">
                    <span class="blupal-badge">نسخه <?php echo esc_html(BLUPAL_C2C_VERSION); ?></span>
                    <h3>🛡️ راهنمای اتصال و امنیت دامنه</h3>
                </div>
                <div class="blupal-c2c-banner-body">
                    <p>۱. کلید API اختصاصی خود را از پنل کاربری کپی کرده و در فیلد زیر قرار دهید.</p>
                    <p>۲. دامنه مجاز در پنل کاربری شما باید برابر با <code dir="ltr"><?php echo esc_html($clean_host); ?></code> تنظیم شده باشد.</p>
                    <p class="blupal-c2c-ok">✓ نیازی به وارد کردن شماره کارت در سایت نیست؛ اطلاعات کارت و تایید واریز به صورت خودکار از سرور دریافت می‌شود.</p>
                </div>
            </div>

            <table class="form-table">
                <?php $this->generate_settings_html(); ?>
            </table>

            <script type="text/javascript">
            (function($) {
                $(document).ready(function() {
                    function renderSuccessResult(data, $resultBox) {
                        var details = data.details || {};
                        var latency = data.latency_ms ? data.latency_ms + ' میلی‌ثانیه' : 'آنی';

                        var html = '<div class="blupal-alert blupal-alert-success">';
                        html += '<div class="blupal-alert-head">✅ <strong>اتصال به سرور کاملاً برقرار و تایید شد!</strong> <span class="blupal-latency">پینگ سرور: ' + latency + '</span></div>';
                        html += '<p class="blupal-alert-msg">' + (data.message || 'ارتباط با سرور پرداخت با موفقیت برقرار شد.') + '</p>';

                        html += '<div class="blupal-details-grid">';
                        if (details.gateway_title) {
                            html += '<div class="blupal-grid-item"><span>نام درگاه در سامانه:</span> <strong>' + details.gateway_title + '</strong></div>';
                        }
                        if (details.card_holder) {
                            html += '<div class="blupal-grid-item"><span>وضعیت کارت پذیرنده:</span> <strong style="color:#059669;">' + details.card_holder + '</strong></div>';
                        }
                        if (details.authorized_domain) {
                            html += '<div class="blupal-grid-item"><span>دامنه مجاز درگاه:</span> <code dir="ltr">' + details.authorized_domain + '</code></div>';
                        }
                        if (details.server_url) {
                            html += '<div class="blupal-grid-item"><span>آدرس سرور پاسخ‌دهنده:</span> <code dir="ltr">' + details.server_url + '</code></div>';
                        }
                        html += '</div>';
                        html += '</div>';

                        $resultBox.html(html).slideDown(200);
                    }

                    function renderErrorResult(err, $resultBox, note) {
                        var errMsg = (err && err.message) ? err.message : 'عدم امکان برقراری ارتباط با وب‌سرویس.';
                        var latency = (err && err.latency_ms) ? ' (زمان پاسخ: ' + err.latency_ms + 'ms)' : '';

                        var html = '<div class="blupal-alert blupal-alert-error">';
                        html += '<div class="blupal-alert-head">❌ <strong>خطا در بررسی ارتباط:</strong> ' + latency + '</div>';
                        html += '<p class="blupal-alert-msg">' + errMsg + '</p>';
                        if (note) {
                            html += '<div class="blupal-troubleshoot-hint">💡 ' + note + '</div>';
                        } else {
                            html += '<div class="blupal-troubleshoot-hint">💡 <strong>راهنما:</strong> لطفاً آدرس سرور و کلید API را مجدداً بررسی کنید و در پایین صفحه روی «ذخیره تغییرات» کلیک نمایید.</div>';
                        }
                        html += '</div>';

                        $resultBox.html(html).slideDown(200);
                    }

                    $('#blupal-btn-test-connection').on('click', function(e) {
                        e.preventDefault();
                        var $btn = $(this);
                        var $spinner = $btn.find('.blupal-spinner');
                        var $btnText = $btn.find('.blupal-btn-text');
                        var $resultBox = $('#blupal-test-result');

                        var serverUrl = ($('#woocommerce_blupal_c2c_server_url').val() || '<?php echo esc_js($this->server_url); ?>').trim().replace(/\\/+$/, '');
                        var apiKey = ($('#woocommerce_blupal_c2c_api_key').val() || '<?php echo esc_js($this->api_key); ?>').trim();
                        var ajaxUrl = (typeof ajaxurl !== 'undefined') ? ajaxurl : '<?php echo esc_js(admin_url('admin-ajax.php')); ?>';

                        if (!serverUrl) {
                            renderErrorResult({ message: 'لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات زیر وارد نمایید.' }, $resultBox);
                            return;
                        }

                        $btn.prop('disabled', true);
                        $spinner.show();
                        $btnText.text('در حال برقراری ارتباط با سرور...');
                        $resultBox.slideUp(150);

                        // 1. First attempt: Standard WordPress backend AJAX
                        $.ajax({
                            url: ajaxUrl,
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                action: 'blupal_c2c_test_connection',
                                security: '<?php echo esc_js($test_nonce); ?>',
                                server_url: serverUrl,
                                api_key: apiKey
                            },
                            success: function(response) {
                                $btn.prop('disabled', false);
                                $spinner.hide();
                                $btnText.text('بررسی مجدد اتصال به سرور');

                                if (response && response.success && response.data) {
                                    renderSuccessResult(response.data, $resultBox);
                                } else {
                                    var err = (response && response.data) ? response.data : { message: 'پاسخ ناموفق از سرور' };
                                    renderErrorResult(err, $resultBox);
                                }
                            },
                            error: function(xhr, status, error) {
                                // 2. Fallback: Direct browser fetch to server test endpoint if WP AJAX had issue
                                var directEndpoint = serverUrl + '/api/v1/woocommerce/test-connection';
                                var startTime = Date.now();

                                fetch(directEndpoint, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                        'X-WP-API-KEY': apiKey
                                    },
                                    body: JSON.stringify({
                                        api_key: apiKey,
                                        site_url: window.location.origin,
                                        domain: window.location.hostname
                                    })
                                })
                                .then(function(res) { return res.json(); })
                                .then(function(directData) {
                                    $btn.prop('disabled', false);
                                    $spinner.hide();
                                    $btnText.text('بررسی مجدد اتصال به سرور');
                                    directData.latency_ms = Date.now() - startTime;

                                    if (directData && directData.success) {
                                        renderSuccessResult(directData, $resultBox);
                                    } else {
                                        renderErrorResult(directData, $resultBox);
                                    }
                                })
                                .catch(function(fetchErr) {
                                    $btn.prop('disabled', false);
                                    $spinner.hide();
                                    $btnText.text('تلاش مجدد برای تست اتصال');

                                    var detailedMsg = 'عدم دسترسی به سرور پرداخت. لطفا مطمئن شوید آدرس سرور به صورت کامل و با پیشوند https:// وارد شده است.';
                                    if (xhr && xhr.status === 403) {
                                        detailedMsg = 'دسترسی غیرمجاز وردپرس (کد ۴۰۳). لطفاً صفحه را رفرش فرمایید.';
                                    }
                                    renderErrorResult({ message: detailedMsg }, $resultBox, 'آدرس سرور جاری: <code>' + serverUrl + '</code>');
                                });
                            }
                        });
                    });
                });
            })(jQuery);
            </script>
            <?php
        }

        /**
         * Process payment and redirect customer to payment page
         */
        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            if (!$order) {
                wc_add_notice(__('سفارش مورد نظر یافت نشد.', 'wc-blupal-c2c'), 'error');
                return array('result' => 'failure');
            }

            if (empty($this->api_key)) {
                wc_add_notice(__('کلید درگاه کارت به کارت در تنظیمات ووکامرس پیکربندی نشده است.', 'wc-blupal-c2c'), 'error');
                return array('result' => 'failure');
            }

            // Convert currency to Tomans
            $currency = get_woocommerce_currency();
            $order_total = floatval($order->get_total());
            $amount_in_tomans = $order_total;
            $curr_upper = strtoupper(trim($currency));

            if (in_array($curr_upper, array('IRR', 'RIAL', 'RIALS', 'IR_RIAL', 'IRR_CURRENCY'))) {
                $amount_in_tomans = $order_total / 10;
            } elseif (in_array($curr_upper, array('IRHR', 'THOUSAND_TOMAN', 'HEZAR_TOMAN'))) {
                $amount_in_tomans = $order_total * 1000;
            }

            $customer_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
            if (empty($customer_name)) {
                $customer_name = 'مشتری سفارش #' . $order_id;
            }

            $customer_data = array(
                'name'  => $customer_name,
                'phone' => $order->get_billing_phone(),
                'email' => $order->get_billing_email(),
            );

            $callback_url = add_query_arg(array('wc-api' => 'wc_blupal_c2c', 'order_id' => $order_id), home_url('/'));

            // Call API
            $result = $this->api->create_order($order_id, $amount_in_tomans, $currency, $customer_data, $callback_url);

            if (!$result || !isset($result['success']) || !$result['success']) {
                $msg = isset($result['message']) ? $result['message'] : __('خطا در صدور فاکتور پرداخت.', 'wc-blupal-c2c');
                wc_add_notice($msg, 'error');
                return array('result' => 'failure');
            }

            // Save invoice id into order meta
            if (!empty($result['invoice_id'])) {
                $order->update_meta_data('_blupal_c2c_invoice_id', sanitize_text_field($result['invoice_id']));
                $order->save();
            }

            // Redirect customer to secure payment page
            return array(
                'result'   => 'success',
                'redirect' => $result['payment_url'],
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
         * Handle return callback and webhook
         */
        public function handle_callback() {
            Blupal_C2C_Webhook::handle($this, $this->api);
        }
    }
}
`;
}

/**
 * 3. API Client File: includes/class-blupal-api.php
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
            $this->server_url = rtrim($server_url, '/');
            $this->api_key    = trim($api_key);
        }

        /**
         * Create order on server and get payment URL
         */
        public function create_order($order_id, $amount, $currency, $customer_data, $callback_url) {
            $site_url = get_site_url();
            $endpoint = $this->server_url . '/api/v1/woocommerce/create-order';

            $payload = array(
                'api_key'        => $this->api_key,
                'order_id'       => (string) $order_id,
                'amount'         => (float) $amount,
                'currency'       => $currency,
                'customer_name'  => $customer_data['name'],
                'customer_phone' => $customer_data['phone'],
                'customer_email' => $customer_data['email'],
                'site_url'       => $site_url,
                'callback_url'   => $callback_url,
                'description'    => sprintf('سفارش #%s در %s', $order_id, get_bloginfo('name')),
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
                    'X-WP-API-KEY' => $this->api_key,
                    'Origin'       => $site_url,
                    'Referer'      => $site_url,
                ),
                'body'        => json_encode($payload),
            ));

            if (is_wp_error($response)) {
                return array('success' => false, 'message' => $response->get_error_message());
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            $code = wp_remote_retrieve_response_code($response);

            if ($code !== 200 || !isset($data['success']) || !$data['success']) {
                $msg = isset($data['message']) ? $data['message'] : 'خطا در ارتباط با سرور صدور فاکتور';
                return array('success' => false, 'message' => $msg);
            }

            return $data;
        }

        /**
         * Verify payment status of an invoice
         */
        public function verify_order($order_id, $invoice_id) {
            $site_url = get_site_url();
            $verify_endpoint = add_query_arg(array(
                'order_id'   => $order_id,
                'invoice_id' => $invoice_id,
            ), $this->server_url . '/api/v1/woocommerce/verify');

            $response = wp_remote_get($verify_endpoint, array(
                'timeout' => 20,
                'headers' => array(
                    'Accept'       => 'application/json',
                    'X-WP-API-KEY' => $this->api_key,
                    'Origin'       => $site_url,
                    'Referer'      => $site_url,
                ),
            ));

            if (is_wp_error($response)) {
                return array('success' => false, 'message' => $response->get_error_message());
            }

            $body = wp_remote_retrieve_body($response);
            return json_decode($body, true);
        }

        /**
         * Test live connection with the payment gateway server and validate API key
         */
        public function test_connection() {
            $site_url = get_site_url();
            $endpoint = $this->server_url . '/api/v1/woocommerce/test-connection';

            $start_time = microtime(true);

            $response = wp_remote_post($endpoint, array(
                'method'      => 'POST',
                'timeout'     => 15,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking'    => true,
                'headers'     => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                    'X-WP-API-KEY' => $this->api_key,
                    'Origin'       => $site_url,
                    'Referer'      => $site_url,
                ),
                'body'        => json_encode(array(
                    'api_key'    => $this->api_key,
                    'site_url'   => $site_url,
                    'domain'     => preg_replace('/^https?:\/\//i', '', $site_url),
                    'wp_version' => get_bloginfo('version'),
                    'wc_version' => defined('WC_VERSION') ? WC_VERSION : 'unknown',
                )),
            ));

            $latency_ms = round((microtime(true) - $start_time) * 1000);

            if (is_wp_error($response)) {
                return array(
                    'success'    => false,
                    'status'     => 'network_error',
                    'message'    => 'عدم امکان برقراری ارتباط با سرور: ' . $response->get_error_message(),
                    'latency_ms' => $latency_ms,
                );
            }

            $body = wp_remote_retrieve_body($response);
            $code = wp_remote_retrieve_response_code($response);
            $data = json_decode($body, true);

            if (!is_array($data)) {
                return array(
                    'success'    => false,
                    'status'     => 'invalid_response',
                    'message'    => sprintf('پاسخ نامعتبر از سرور (کد وضعیت: %s). بررسی فرمایید آدرس سرور بدون اسلش پایانی ثبت شده باشد.', $code),
                    'latency_ms' => $latency_ms,
                    'raw_body'   => substr($body, 0, 300),
                );
            }

            $data['latency_ms'] = $latency_ms;
            $data['http_code']  = $code;
            return $data;
        }
    }
}
`;
}

/**
 * 4. Webhook and Callback Handler File: includes/class-blupal-webhook.php
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
                wp_die(__('شناسه سفارش نامعتبر است.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'), array('response' => 400));
            }

            $order = wc_get_order($order_id);
            if (!$order) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('message' => 'سفارش مورد نظر یافت نشد.'), 404);
                    exit;
                }
                wp_die(__('سفارش مورد نظر یافت نشد.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'), array('response' => 404));
            }

            // If already paid, exit gracefully
            if ($order->is_paid()) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_success(array('order_id' => $order_id, 'status' => 'already_paid'));
                    exit;
                }
                if (function_exists('WC') && WC()->cart) {
                    WC()->cart->empty_cart();
                }
                wp_safe_redirect($gateway->get_return_url($order));
                exit;
            }

            // Verify with API
            $data = $api->verify_order($order_id, $invoice_id);

            if (!$data || !isset($data['success']) || !$data['success']) {
                $order->add_order_note(__('خطا در استعلام وضعیت پرداخت از سرور کارت به کارت: ', 'wc-blupal-c2c') . (isset($data['message']) ? $data['message'] : 'عدم پاسخگویی'));
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('message' => 'خطا در ارتباط با سرور تایید'));
                    exit;
                }
                wc_add_notice(__('خطا در اعتبارسنجی پرداخت. در صورت کسر وجه با پشتیبانی تماس بگیرید.', 'wc-blupal-c2c'), 'error');
                wp_safe_redirect(wc_get_checkout_url());
                exit;
            }

            $is_paid = isset($data['status']) && $data['status'] === 'paid';

            if ($is_paid) {
                $tracking_code = isset($data['tracking_code']) ? sanitize_text_field($data['tracking_code']) : (isset($_REQUEST['tracking_code']) ? sanitize_text_field($_REQUEST['tracking_code']) : 'تایید شده');

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

                if (function_exists('WC') && WC()->cart) {
                    WC()->cart->empty_cart();
                }
                wp_safe_redirect($gateway->get_return_url($order));
                exit;
            } else {
                $order->update_status('failed', __('پرداخت کارت به کارت تایید نشد یا منقضی گردید.', 'wc-blupal-c2c'));

                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    wp_send_json_error(array('order_id' => $order_id, 'status' => 'failed'));
                    exit;
                }

                wc_add_notice(__('پرداخت کارت به کارت تایید نشد یا زمان واریز به پایان رسید. لطفاً مجدداً تلاش فرمایید.', 'wc-blupal-c2c'), 'error');
                wp_safe_redirect(wc_get_checkout_url());
                exit;
            }
        }
    }
}
`;
}

/**
 * 5. Admin CSS File: assets/css/admin.css
 */
export function generateAdminCss(): string {
  return `/* Blupal C2C Admin Styles */
.blupal-c2c-test-box {
    background: #ffffff;
    border: 1px solid #e0e7ff;
    border-radius: 12px;
    padding: 18px 22px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.05);
}

.blupal-test-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
}

.blupal-test-title {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.blupal-test-icon {
    font-size: 24px;
    line-height: 1;
    background: #eef2ff;
    padding: 8px;
    border-radius: 10px;
}

.blupal-test-title strong {
    display: block;
    font-size: 14px;
    color: #1e1b4b;
    margin-bottom: 3px;
}

.blupal-test-title p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
}

.blupal-btn-test {
    background: #4f46e5 !important;
    border-color: #4338ca !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 6px 18px !important;
    height: auto !important;
    border-radius: 8px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2) !important;
    cursor: pointer;
}

.blupal-btn-test:hover {
    background: #4338ca !important;
}

.blupal-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: blupal-spin 0.8s linear infinite;
}

@keyframes blupal-spin {
    to { transform: rotate(360deg); }
}

.blupal-test-result {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #e2e8f0;
}

.blupal-alert {
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
    line-height: 1.7;
}

.blupal-alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
}

.blupal-alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.blupal-alert-head {
    font-size: 14px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.blupal-latency {
    font-size: 11px;
    font-weight: bold;
    background: #dcfce7;
    color: #15803d;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid #86efac;
}

.blupal-alert-msg {
    margin: 0 0 10px 0;
}

.blupal-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    background: #ffffff;
    border: 1px solid #dcfce7;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
}

.blupal-grid-item {
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.blupal-grid-item span {
    color: #64748b;
    font-size: 11px;
}

.blupal-troubleshoot-hint {
    background: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #fee2e2;
    font-size: 11px;
    color: #7f1d1d;
    margin-top: 8px;
}

.blupal-c2c-banner {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 18px 22px;
    margin-bottom: 24px;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.8;
}

.blupal-c2c-banner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

.blupal-c2c-banner-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
    color: #1e293b;
}

.blupal-badge {
    background: #e0e7ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
}

.blupal-c2c-banner-body p {
    margin: 0 0 6px 0;
    color: #475569;
}

.blupal-c2c-banner-body code {
    background: #e2e8f0;
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: bold;
    color: #0f172a;
    font-family: monospace;
}

.blupal-c2c-ok {
    margin-top: 10px !important;
    color: #059669 !important;
    font-weight: 600;
}
`;
}

/**
 * 6. Gateway SVG Icon: assets/images/icon.svg
 */
export function generateIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="64" height="48">
  <rect x="2" y="4" width="60" height="40" rx="6" fill="#4F46E5" />
  <rect x="2" y="12" width="60" height="8" fill="#312E81" />
  <rect x="8" y="26" width="16" height="10" rx="2" fill="#FCD34D" />
  <circle cx="48" cy="31" r="5" fill="#38BDF8" fill-opacity="0.8" />
  <circle cx="54" cy="31" r="5" fill="#F43F5E" fill-opacity="0.8" />
</svg>`;
}

/**
 * 7. Localization Template: languages/wc-blupal-c2c.pot
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
 * 8. WordPress Readme File: readme.txt
 */
export function generateReadmeTxt(): string {
  return `=== درگاه پرداخت کارت به کارت هوشمند برای ووکامرس ===
Contributors: samaneh
Tags: woocommerce, payment gateway, card to card, blupal, کارت به کارت, ووکامرس
Requires at least: 5.4
Tested up to: 6.7
Requires PHP: 7.2
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

افزونه ساختاریافته پرداخت مستقیم کارت به کارت هوشمند با تایید آنی شبکه شتاب برای ووکامرس.

== ساختار فایل‌ها و پوشه‌ها ==
blupal-card-to-card-gateway/
├── blupal-card-to-card-gateway.php   (فایل اصلی راه‌انداز افزونه وردپرس)
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
│   └── wc-blupal-c2c.pot             (فایل استاندارد ترجمه و چندزبانه)
└── readme.txt                        (مستندات و راهنمای کامل نصب)

== راهنمای نصب و راه‌اندازی ==
۱. وارد بخش «افزونه‌ها > افزودن» در پیشخوان وردپرس شوید.
۲. روی دکمه «بارگذاری افزونه» در بالای برگه کلیک کنید.
۳. همین فایل ZIP را انتخاب و دکمه «هم‌اکنون نصب کن» را بزنید.
۴. پس از نصب، افزونه را «فعال» کنید.
۵. به منوی «ووکامرس > پیکربندی > زبانه پرداخت‌ها > پرداخت کارت به کارت هوشمند» بروید.
۶. کلید اختصاصی API Key خود را وارد کرده و ذخیره نمایید.

توجه: دامنه سایت وردپرسی شما باید در پنل درگاه به عنوان دامنه مجاز ثبت شده باشد.

== تغییرات نسخه ۱.۱.۰ ==
* بازنویسی و تفکیک کامل کدها در قالب فایل‌ها و پوشه‌های استاندارد وردپرس.
* جداسازی کلاس‌های API، وب‌هوک و درگاه در پوشه includes.
* افزودن استایل اختصاصی و آیکون کارت در پوشه assets.
* پشتیبانی کامل از HPOS (Custom Order Tables) و تسویه حساب بلوکی ووکامرس (Checkout Blocks).
* پشتیبانی کامل از وب‌هوک‌های پس‌زمینه و بازگشت مشتری.
`;
}

/**
 * 9. WooCommerce Blocks Integration Class: includes/class-blupal-blocks-support.php
 */
export function generateBlocksSupportPhp(): string {
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

use Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType;

if (!class_exists('WC_Blupal_Blocks_Support') && class_exists('Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType')) {
    final class WC_Blupal_Blocks_Support extends AbstractPaymentMethodType {
        protected $name = 'blupal_c2c';

        public function initialize() {
            $this->settings = get_option('woocommerce_blupal_c2c_settings', array());
        }

        public function is_active() {
            $enabled = isset($this->settings['enabled']) ? $this->settings['enabled'] : 'yes';
            return ('no' !== $enabled && '0' !== $enabled && false !== $enabled);
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
                'title'       => isset($this->settings['title']) && !empty($this->settings['title']) ? $this->settings['title'] : __('پرداخت کارت به کارت هوشمند (تایید آنی)', 'wc-blupal-c2c'),
                'description' => isset($this->settings['description']) && !empty($this->settings['description']) ? $this->settings['description'] : __('انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.', 'wc-blupal-c2c'),
                'icon'        => BLUPAL_C2C_URL . 'assets/images/icon.svg',
                'supports'    => array('products'),
                'ariaLabel'   => __('پرداخت کارت به کارت هوشمند (تایید آنی)', 'wc-blupal-c2c'),
            );
        }
    }
}
`;
}

/**
 * 10. WooCommerce Blocks JavaScript Component: assets/js/blocks.js
 */
export function generateBlocksJs(): string {
  return `(function () {
    var isRegistered = false;

    function initBlupalBlocksGateway() {
        if (isRegistered) return true;

        var registry = (window.wc && window.wc.wcBlocksRegistry) || window.wcBlocksRegistry;
        var wcSettingsObj = (window.wc && window.wc.wcSettings) || window.wcSettings;
        var wpElem = (window.wp && window.wp.element) || (window.React ? { createElement: window.React.createElement } : null);

        if (!registry || !registry.registerPaymentMethod) {
            return false;
        }

        var settings = {};
        if (wcSettingsObj && typeof wcSettingsObj.getSetting === 'function') {
            settings = wcSettingsObj.getSetting('blupal_c2c_data', {});
        }
        if (!settings.title && window.blupalC2cConfig) {
            settings = window.blupalC2cConfig;
        }

        var titleText = settings.title || 'پرداخت کارت به کارت هوشمند (تایید آنی)';
        var descText = settings.description || 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.';
        var iconUrl = settings.icon || '';

        var createElem = (wpElem && wpElem.createElement) ? wpElem.createElement : function(tag, props, child) {
            return child;
        };

        var Content = function () {
            if (!wpElem || !wpElem.createElement) {
                return null;
            }
            return createElem(
                'div',
                { 
                    style: { 
                        padding: '10px 4px', 
                        fontSize: '13px', 
                        color: '#475569', 
                        lineHeight: '1.8' 
                    } 
                },
                descText
            );
        };

        var Label = function (props) {
            if (!wpElem || !wpElem.createElement) {
                return titleText;
            }
            var PaymentMethodLabel = props && props.components ? props.components.PaymentMethodLabel : null;
            if (PaymentMethodLabel) {
                return createElem(PaymentMethodLabel, { text: titleText });
            }
            return createElem('span', { style: { fontWeight: '600' } }, titleText);
        };

        try {
            registry.registerPaymentMethod({
                name: 'blupal_c2c',
                label: createElem(Label, null),
                content: createElem(Content, null),
                edit: createElem(Content, null),
                canMakePayment: function () { return true; },
                ariaLabel: titleText,
                supports: {
                    features: (settings && settings.supports) ? settings.supports : ['products'],
                },
            });
            isRegistered = true;
            return true;
        } catch (e) {
            console.warn('Blupal C2C Block registration error:', e);
            return false;
        }
    }

    // Attempt immediately
    if (!initBlupalBlocksGateway()) {
        // Polling retry loop up to 100 times (5 seconds)
        var attempts = 0;
        var intervalId = setInterval(function () {
            attempts++;
            if (initBlupalBlocksGateway() || attempts > 100) {
                clearInterval(intervalId);
            }
        }, 50);

        if (window.wp && window.wp.domReady) {
            window.wp.domReady(function() {
                initBlupalBlocksGateway();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                initBlupalBlocksGateway();
            });
        }
    }
})();
`;
}


