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
 * Plugin Name: درگاه پرداخت کارت به کارت هوشمند (رخش پی )
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
 * WC tested up to: 11.1
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

// Load plugin text domain for localization
add_action('init', 'blupal_c2c_load_textdomain');
function blupal_c2c_load_textdomain() {
    load_plugin_textdomain(
        'wc-blupal-c2c',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
}

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
 * Register WooCommerce Blocks Checkout support
 */
add_action('woocommerce_blocks_loaded', 'blupal_c2c_register_blocks_support');
function blupal_c2c_register_blocks_support() {
    if (!class_exists('Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType')) {
        return;
    }

    require_once BLUPAL_C2C_DIR . 'includes/class-blupal-blocks-support.php';
}

// Hook to payment method type registration for modern WC Blocks
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
    // بررسی هم‌زمان nonce و سطح دسترسی — هر دو الزامی هستند.
    $nonce = isset($_POST['security']) ? sanitize_text_field(wp_unslash($_POST['security'])) : '';

    if (!wp_verify_nonce($nonce, 'blupal_c2c_test_nonce')) {
        wp_send_json_error(array(
            'status'  => 'nonce_failed',
            'message' => 'اعتبار نشست کاری به پایان رسیده است. لطفاً صفحه را رفرش فرمایید.',
        ), 403);
        exit;
    }

    if (!current_user_can('manage_woocommerce') && !current_user_can('manage_options')) {
        wp_send_json_error(array(
            'status'  => 'unauthorized',
            'message' => 'دسترسی غیرمجاز. فقط مدیران فروشگاه امکان بررسی اتصال را دارند.',
        ), 403);
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

            // Webhook and Callback listener: /?wc-api=wc_blupal_c2c
            add_action('woocommerce_api_wc_blupal_c2c', array($this, 'handle_callback'));

            // Enqueue admin assets on our settings page
            add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        }

        /**
         * Enqueue admin stylesheets
         */
        public function enqueue_admin_assets() {
            $section = isset($_GET['section']) ? sanitize_text_field($_GET['section']) : '';
            if (strtolower($section) === strtolower($this->id)) {
                wp_enqueue_style(
                    'blupal-c2c-admin',
                    BLUPAL_C2C_URL . 'assets/css/admin.css',
                    array(),
                    BLUPAL_C2C_VERSION
                );
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
                        __('آدرس سرور یا دامنه سامانه پرداخت رخش پی بدون اسلش پایانی. پیش‌فرض: <strong dir="ltr">%s</strong>', 'wc-blupal-c2c'),
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
         * Render modern admin options page with Gutenberg-standard cards and Live Diagnostic Tool
         */
        public function admin_options() {
            $site_host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field($_SERVER['HTTP_HOST']) : '';
            $clean_host = preg_replace('/^www\\./i', '', $site_host);
            $test_nonce = wp_create_nonce('blupal_c2c_test_nonce');
            $is_enabled = ($this->enabled === 'yes');
            $callback_url = function_exists('WC') ? WC()->api_request_url('WC_Gateway_Blupal_C2C') : site_url('/?wc-api=wc_blupal_c2c');
            ?>
            <style>
            /* Blupal Modern WordPress Admin Styles - Self Contained Zero Dependency */
            .blupal-admin-wrap {
                max-width: 980px;
                margin: 20px 0 40px 0;
                direction: rtl;
                text-align: right;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", "IRANSans", Tahoma, sans-serif;
                color: #0f172a;
                box-sizing: border-box;
            }
            .blupal-admin-wrap * {
                box-sizing: border-box;
            }
            /* Hide the ugly default empty table if outputted by WC */
            .woocommerce .form-table,
            table.form-table {
                display: none !important;
            }
            /* Hero Banner */
            .blupal-hero-banner {
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
                color: #ffffff;
                border-radius: 16px;
                padding: 24px 28px;
                margin-bottom: 24px;
                box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.25);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 18px;
            }
            .blupal-hero-main {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .blupal-hero-icon {
                width: 52px;
                height: 52px;
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                flex-shrink: 0;
            }
            .blupal-hero-title {
                font-size: 19px;
                font-weight: 800;
                margin: 0 0 4px 0;
                color: #ffffff;
                letter-spacing: -0.02em;
            }
            .blupal-hero-subtitle {
                font-size: 12px;
                color: #cbd5e1;
                margin: 0;
                line-height: 1.5;
            }
            .blupal-hero-badges {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .blupal-status-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                transition: all 0.2s ease;
            }
            .blupal-status-pill.is-active {
                background: rgba(16, 185, 129, 0.15);
                color: #34d399;
                border: 1px solid rgba(52, 211, 153, 0.3);
            }
            .blupal-status-pill.is-inactive {
                background: rgba(148, 163, 184, 0.15);
                color: #94a3b8;
                border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .blupal-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
                box-shadow: 0 0 8px currentColor;
            }
            .blupal-version-badge {
                background: rgba(255, 255, 255, 0.1);
                color: #e2e8f0;
                border: 1px solid rgba(255, 255, 255, 0.15);
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
            }
            /* Cards */
            .blupal-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                padding: 22px 26px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .blupal-card:hover {
                border-color: #cbd5e1;
            }
            .blupal-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-bottom: 16px;
                margin-bottom: 20px;
                border-bottom: 1px solid #f1f5f9;
                flex-wrap: wrap;
                gap: 10px;
            }
            .blupal-card-title {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .blupal-card-title h3 {
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
            }
            .blupal-card-icon {
                font-size: 20px;
                line-height: 1;
            }
            .blupal-card-desc {
                font-size: 12px;
                color: #64748b;
                margin: 0;
            }
            .blupal-badge-soft {
                background: #f1f5f9;
                color: #475569;
                font-size: 11px;
                font-weight: 600;
                padding: 3px 10px;
                border-radius: 6px;
            }
            /* Form controls */
            .blupal-form-group {
                margin-bottom: 20px;
            }
            .blupal-form-group:last-child {
                margin-bottom: 0;
            }
            .blupal-label {
                display: block;
                font-size: 13px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
            }
            .blupal-label .required-star {
                color: #ef4444;
            }
            .blupal-input-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .blupal-input {
                width: 100%;
                height: 44px;
                padding: 8px 14px;
                font-size: 13px;
                color: #0f172a;
                background: #ffffff;
                border: 1.5px solid #cbd5e1;
                border-radius: 10px;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .blupal-input:focus,
            .blupal-textarea:focus {
                border-color: #4f46e5 !important;
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
                outline: none !important;
            }
            .blupal-input-ltr {
                direction: ltr;
                text-align: left;
                font-family: monospace, -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .blupal-textarea {
                width: 100%;
                min-height: 84px;
                padding: 10px 14px;
                font-size: 13px;
                color: #0f172a;
                background: #ffffff;
                border: 1.5px solid #cbd5e1;
                border-radius: 10px;
                line-height: 1.6;
                transition: border-color 0.2s, box-shadow 0.2s;
                resize: vertical;
            }
            .blupal-btn-action {
                height: 44px;
                padding: 0 14px;
                background: #f8fafc;
                border: 1.5px solid #cbd5e1;
                border-radius: 10px;
                color: #475569;
                font-size: 12px;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.15s ease;
            }
            .blupal-btn-action:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
                color: #0f172a;
            }
            .blupal-btn-action.is-copied {
                background: #ecfdf5 !important;
                border-color: #10b981 !important;
                color: #047857 !important;
            }
            .blupal-field-hint {
                font-size: 11px;
                color: #64748b;
                margin-top: 6px;
                line-height: 1.6;
            }
            .blupal-inline-action {
                color: #4f46e5;
                text-decoration: underline;
                cursor: pointer;
                margin-right: 6px;
                font-weight: 600;
            }
            .blupal-inline-action:hover {
                color: #3730a3;
            }
            /* Modern Toggle Switch */
            .blupal-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            }
            .blupal-toggle-info {
                flex: 1;
            }
            .blupal-toggle-title {
                font-size: 15px;
                font-weight: 700;
                color: #0f172a;
                margin: 0 0 4px 0;
            }
            .blupal-toggle-desc {
                font-size: 12px;
                color: #64748b;
                margin: 0;
                line-height: 1.6;
            }
            .blupal-switch {
                position: relative;
                display: inline-block;
                width: 52px;
                height: 28px;
                flex-shrink: 0;
            }
            .blupal-switch input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }
            .blupal-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #cbd5e1;
                transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 34px;
            }
            .blupal-slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .blupal-switch input:checked + .blupal-slider {
                background-color: #10b981;
            }
            .blupal-switch input:checked + .blupal-slider:before {
                transform: translateX(24px);
            }
            /* Domain notice box */
            .blupal-notice-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 14px 18px;
                margin-top: 14px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            .blupal-notice-icon {
                font-size: 18px;
                line-height: 1;
                margin-top: 2px;
            }
            .blupal-notice-content {
                font-size: 12px;
                color: #334155;
                line-height: 1.7;
            }
            .blupal-notice-content strong {
                color: #0f172a;
            }
            .blupal-notice-content code {
                background: #e2e8f0;
                color: #1e1b4b;
                padding: 2px 7px;
                border-radius: 5px;
                font-size: 11px;
                font-weight: 700;
            }
            /* Live Diagnostic Card */
            .blupal-test-container {
                background: #faf5ff;
                border: 1px solid #e9d5ff;
                border-radius: 14px;
                padding: 20px 24px;
                margin-bottom: 20px;
            }
            .blupal-test-header-wrap {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 14px;
            }
            .blupal-test-intro {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .blupal-test-intro-icon {
                width: 40px;
                height: 40px;
                background: #f3e8ff;
                color: #9333ea;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            }
            .blupal-test-intro-text strong {
                display: block;
                font-size: 14px;
                color: #581c87;
                margin-bottom: 2px;
            }
            .blupal-test-intro-text p {
                margin: 0;
                font-size: 11px;
                color: #7e22ce;
            }
            .blupal-btn-test {
                background: #7c3aed !important;
                border: 1px solid #6d28d9 !important;
                color: #ffffff !important;
                font-weight: 700 !important;
                font-size: 12px !important;
                padding: 10px 20px !important;
                height: auto !important;
                border-radius: 10px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25) !important;
                cursor: pointer !important;
                transition: all 0.15s ease !important;
            }
            .blupal-btn-test:hover {
                background: #6d28d9 !important;
                transform: translateY(-1px);
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
                margin-top: 18px;
                padding-top: 18px;
                border-top: 1px dashed #d8b4fe;
            }
            .blupal-alert {
                border-radius: 10px;
                padding: 14px 18px;
                font-size: 12px;
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
                font-size: 13px;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
            }
            .blupal-latency {
                font-size: 11px;
                font-weight: 700;
                background: #dcfce7;
                color: #15803d;
                padding: 2px 8px;
                border-radius: 6px;
                border: 1px solid #86efac;
            }
            .blupal-details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 8px;
                background: #ffffff;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 12px;
                margin-top: 10px;
            }
            .blupal-grid-item {
                font-size: 11px;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .blupal-grid-item span {
                color: #64748b;
                font-size: 10px;
            }
            .blupal-troubleshoot-hint {
                background: #ffffff;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #fecaca;
                font-size: 11px;
                color: #7f1d1d;
                margin-top: 8px;
            }
            /* Checkout Preview Card */
            .blupal-preview-wrap {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px;
                margin-top: 14px;
            }
            .blupal-preview-header {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .blupal-checkout-mock {
                background: #ffffff;
                border: 2px solid #4f46e5;
                border-radius: 10px;
                padding: 14px 16px;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
                transition: opacity 0.2s;
            }
            .blupal-checkout-mock.is-disabled {
                opacity: 0.45;
                border-color: #cbd5e1;
            }
            .blupal-mock-radio-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .blupal-mock-radio-left {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .blupal-mock-radio {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 5px solid #4f46e5;
                background: #ffffff;
                flex-shrink: 0;
            }
            .blupal-mock-title {
                font-size: 13px;
                font-weight: 700;
                color: #0f172a;
            }
            .blupal-mock-icon {
                height: 24px;
                width: auto;
            }
            .blupal-mock-desc-box {
                background: #f8fafc;
                border-top: 1px solid #f1f5f9;
                margin-top: 10px;
                padding-top: 10px;
                font-size: 12px;
                color: #475569;
                line-height: 1.6;
            }
            /* Specs Grid */
            .blupal-specs-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 14px;
                margin-top: 14px;
            }
            .blupal-spec-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 12px 14px;
            }
            .blupal-spec-card strong {
                display: block;
                font-size: 12px;
                color: #1e293b;
                margin-bottom: 4px;
            }
            .blupal-spec-card p {
                font-size: 11px;
                color: #64748b;
                margin: 0;
                line-height: 1.5;
            }
            /* Save Bar styling override */
            p.submit {
                margin: 24px 0 0 0 !important;
                padding: 0 !important;
            }
            p.submit .button-primary,
            p.submit .woocommerce-save-button {
                background: #4f46e5 !important;
                border: 1px solid #4338ca !important;
                color: #ffffff !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                padding: 12px 32px !important;
                height: auto !important;
                border-radius: 10px !important;
                box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3) !important;
                cursor: pointer !important;
                transition: all 0.15s ease !important;
            }
            p.submit .button-primary:hover,
            p.submit .woocommerce-save-button:hover {
                background: #4338ca !important;
                transform: translateY(-1px);
            }
            /* Mobile Responsiveness */
            @media (max-width: 782px) {
                .blupal-admin-wrap {
                    margin: 10px 0 30px 0;
                }
                .blupal-hero-banner {
                    padding: 18px 18px;
                    border-radius: 12px;
                }
                .blupal-hero-title {
                    font-size: 16px;
                }
                .blupal-card {
                    padding: 18px 16px;
                    border-radius: 12px;
                }
                .blupal-toggle-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
                .blupal-switch {
                    align-self: flex-end;
                }
                .blupal-input-wrap {
                    flex-direction: column;
                    align-items: stretch;
                }
                .blupal-btn-action {
                    width: 100%;
                }
                .blupal-test-header-wrap {
                    flex-direction: column;
                    align-items: stretch;
                }
                .blupal-btn-test {
                    width: 100%;
                    justify-content: center;
                }
                p.submit .button-primary,
                p.submit .woocommerce-save-button {
                    width: 100% !important;
                    text-align: center !important;
                }
            }
            </style>

            <div class="blupal-admin-wrap">
                <!-- HERO HEADER -->
                <div class="blupal-hero-banner">
                    <div class="blupal-hero-main">
                        <div class="blupal-hero-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                <line x1="2" x2="22" y1="10" y2="10"></line>
                                <path d="M7 15h.01"></path>
                                <path d="M11 15h2"></path>
                            </svg>
                        </div>
                        <div>
                            <h1 class="blupal-hero-title">درگاه پرداخت کارت به کارت هوشمند (رخش پی )</h1>
                            <p class="blupal-hero-subtitle">سامانه تایید واریزهای شتاب با اتصال مستقیم به وب‌سرویس و استعلام آنی</p>
                        </div>
                    </div>
                    <div class="blupal-hero-badges">
                        <span id="blupal-live-status-pill" class="blupal-status-pill <?php echo $is_enabled ? 'is-active' : 'is-inactive'; ?>">
                            <span class="blupal-status-dot"></span>
                            <span id="blupal-status-text"><?php echo $is_enabled ? 'درگاه در فروشگاه فعال است' : 'درگاه غیرفعال است'; ?></span>
                        </span>
                        <span class="blupal-version-badge">نسخه <?php echo esc_html(BLUPAL_C2C_VERSION); ?></span>
                    </div>
                </div>

                <!-- CARD 1: ACTIVATION TOGGLE -->
                <div class="blupal-card">
                    <div class="blupal-toggle-row">
                        <div class="blupal-toggle-info">
                            <h3 class="blupal-toggle-title">فعال‌سازی درگاه در برگه تسویه حساب</h3>
                            <p class="blupal-toggle-desc">با فعال‌سازی این گزینه، روش پرداخت کارت به کارت هوشمند در برگه تسویه حساب به خریداران فروشگاه نمایش داده خواهد شد.</p>
                        </div>
                        <label class="blupal-switch" for="woocommerce_blupal_c2c_enabled">
                            <input type="checkbox" name="woocommerce_blupal_c2c_enabled" id="woocommerce_blupal_c2c_enabled" value="yes" <?php checked($this->enabled, 'yes'); ?> />
                            <span class="blupal-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- CARD 2: API & CREDENTIALS -->
                <div class="blupal-card">
                    <div class="blupal-card-header">
                        <div class="blupal-card-title">
                            <span class="blupal-card-icon">🔑</span>
                            <div>
                                <h3>مشخصات وب‌سرویس و کلید دسترسی</h3>
                                <p class="blupal-card-desc">اطلاعات اتصال را از پنل کاربری خود در سامانه رخش پی کپی کرده و وارد نمایید.</p>
                            </div>
                        </div>
                        <span class="blupal-badge-soft">تنظیمات وب‌سرویس</span>
                    </div>

                    <!-- Server URL -->
                    <div class="blupal-form-group">
                        <label class="blupal-label" for="woocommerce_blupal_c2c_server_url">
                            <span>آدرس وب‌سرویس / سرور پرداخت (API Base URL) <span class="required-star">*</span></span>
                        </label>
                        <div class="blupal-input-wrap">
                            <input 
                                type="text" 
                                name="woocommerce_blupal_c2c_server_url" 
                                id="woocommerce_blupal_c2c_server_url" 
                                value="<?php echo esc_attr($this->server_url); ?>" 
                                class="blupal-input blupal-input-ltr" 
                                placeholder="https://pay.yourdomain.ir" 
                                dir="ltr" 
                            />
                            <button type="button" class="blupal-btn-action" onclick="blupalCopyInput('woocommerce_blupal_c2c_server_url', this)">
                                <span>📋 کپی</span>
                            </button>
                        </div>
                    </div>

                    <!-- API Key -->
                    <div class="blupal-form-group">
                        <label class="blupal-label" for="woocommerce_blupal_c2c_api_key">
                            <span>کلید اختصاصی اتصال (API Key) <span class="required-star">*</span></span>
                        </label>
                        <div class="blupal-input-wrap">
                            <input 
                                type="password" 
                                name="woocommerce_blupal_c2c_api_key" 
                                id="woocommerce_blupal_c2c_api_key" 
                                value="<?php echo esc_attr($this->api_key); ?>" 
                                class="blupal-input blupal-input-ltr" 
                                placeholder="کلید اختصاصی را اینجا وارد کنید..." 
                                dir="ltr" 
                            />
                            <button type="button" class="blupal-btn-action" id="blupal-toggle-api-eye" onclick="blupalToggleSecret('woocommerce_blupal_c2c_api_key', this)">
                                <span>👁️ نمایش</span>
                            </button>
                            <button type="button" class="blupal-btn-action" onclick="blupalCopyInput('woocommerce_blupal_c2c_api_key', this)">
                                <span>📋 کپی</span>
                            </button>
                        </div>
                        <div class="blupal-field-hint">
                            کلید دسترسی صادره در پنل درگاه شما جهت احراز هویت درخواست‌ها و تایید سفارشات.
                        </div>
                    </div>

                    <!-- Domain Match Notice -->
                    <div class="blupal-notice-box">
                        <div class="blupal-notice-icon">🛡️</div>
                        <div class="blupal-notice-content">
                            <strong>دامنه مجاز سایت شما: <code dir="ltr"><?php echo esc_html($clean_host); ?></code></strong>
                            <p style="margin: 2px 0 0 0;">جهت تایید خودکار واریزی‌ها، مطمئن شوید این دامنه دقیقاً در تنظیمات درگاه شما در سامانه پرداخت رخش پی به عنوان دامنه مجاز ثبت شده باشد.</p>
                        </div>
                    </div>
                </div>

                <!-- CARD 3: LIVE DIAGNOSTIC TOOL -->
                <div class="blupal-test-container">
                    <div class="blupal-test-header-wrap">
                        <div class="blupal-test-intro">
                            <div class="blupal-test-intro-icon">⚡</div>
                            <div class="blupal-test-intro-text">
                                <strong>ابزار تست زنده و عیب‌یابی وب‌سرویس</strong>
                                <p>بررسی در لحظه ارتباط وردپرس با سرور پرداخت، اعتبار سنجی کلید و اندازه‌گیری پینگ شبکه</p>
                            </div>
                        </div>
                        <button type="button" id="blupal-btn-test-connection" class="blupal-btn-test">
                            <span class="blupal-btn-text">بررسی و تست زنده اتصال</span>
                            <span class="blupal-spinner" style="display: none;"></span>
                        </button>
                    </div>

                    <div id="blupal-test-result" class="blupal-test-result" style="display: none;"></div>
                </div>

                <!-- CARD 4: CHECKOUT PRESENTATION & LIVE PREVIEW -->
                <div class="blupal-card">
                    <div class="blupal-card-header">
                        <div class="blupal-card-title">
                            <span class="blupal-card-icon">🛍️</span>
                            <div>
                                <h3>تنظیمات نمایش در برگه تسویه حساب</h3>
                                <p class="blupal-card-desc">متن و توضیحات قابل مشاهده توسط خریدار در مرحله نهایی ثبت سفارش</p>
                            </div>
                        </div>
                        <span class="blupal-badge-soft">پیش‌نمایش زنده</span>
                    </div>

                    <div class="blupal-form-group">
                        <label class="blupal-label" for="woocommerce_blupal_c2c_title">
                            <span>عنوان درگاه در برگه تسویه حساب <span class="required-star">*</span></span>
                        </label>
                        <input 
                            type="text" 
                            name="woocommerce_blupal_c2c_title" 
                            id="woocommerce_blupal_c2c_title" 
                            value="<?php echo esc_attr($this->title); ?>" 
                            class="blupal-input" 
                            placeholder="پرداخت کارت به کارت هوشمند (تایید آنی)" 
                        />
                        <div class="blupal-field-hint">نامی که خریدار در لیست درگاه‌های تسویه حساب انتخاب می‌کند.</div>
                    </div>

                    <div class="blupal-form-group">
                        <label class="blupal-label" for="woocommerce_blupal_c2c_description">
                            <span>توضیحات درگاه برای خریدار</span>
                        </label>
                        <textarea 
                            name="woocommerce_blupal_c2c_description" 
                            id="woocommerce_blupal_c2c_description" 
                            class="blupal-textarea" 
                            rows="3" 
                            placeholder="انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب."
                        ><?php echo esc_textarea($this->description); ?></textarea>
                        <div class="blupal-field-hint">این راهنما پس از کلیک و انتخاب روش پرداخت توسط خریدار نمایان می‌شود.</div>
                    </div>

                    <!-- Interactive Checkout Mockup Preview -->
                    <div class="blupal-preview-wrap">
                        <div class="blupal-preview-header">
                            <span>👁️ پیش‌نمایش در صفحه تسویه حساب ووکامرس:</span>
                        </div>
                        <div id="blupal-preview-card" class="blupal-checkout-mock <?php echo $is_enabled ? '' : 'is-disabled'; ?>">
                            <div class="blupal-mock-radio-row">
                                <div class="blupal-mock-radio-left">
                                    <div class="blupal-mock-radio"></div>
                                    <span id="blupal-preview-title" class="blupal-mock-title"><?php echo esc_html($this->title); ?></span>
                                </div>
                                <img src="<?php echo esc_url($this->icon); ?>" alt="icon" class="blupal-mock-icon" onerror="this.style.display='none'" />
                            </div>
                            <div id="blupal-preview-desc" class="blupal-mock-desc-box">
                                <?php echo esc_html($this->description); ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <script type="text/javascript">
            // Global copy utility
            function blupalCopyInput(inputId, btn) {
                var input = document.getElementById(inputId);
                if (!input) return;
                var text = input.value;
                if (!navigator.clipboard) {
                    input.select();
                    document.execCommand('copy');
                } else {
                    navigator.clipboard.writeText(text);
                }
                var $btn = jQuery(btn);
                var origHtml = $btn.html();
                $btn.addClass('is-copied').html('<span>✓ کپی شد!</span>');
                setTimeout(function() {
                    $btn.removeClass('is-copied').html(origHtml);
                }, 2000);
            }

            // Secret toggle utility
            function blupalToggleSecret(inputId, btn) {
                var input = document.getElementById(inputId);
                if (!input) return;
                var $btn = jQuery(btn);
                if (input.type === 'password') {
                    input.type = 'text';
                    $btn.html('<span>🔒 مخفی</span>');
                } else {
                    input.type = 'password';
                    $btn.html('<span>👁️ نمایش</span>');
                }
            }

            (function($) {
                $(document).ready(function() {
                    // Live Sync: Enabled Switch -> Status Pill & Preview
                    $('#woocommerce_blupal_c2c_enabled').on('change', function() {
                        var isChecked = $(this).is(':checked');
                        var $pill = $('#blupal-live-status-pill');
                        var $text = $('#blupal-status-text');
                        var $preview = $('#blupal-preview-card');
                        if (isChecked) {
                            $pill.removeClass('is-inactive').addClass('is-active');
                            $text.text('درگاه در فروشگاه فعال است');
                            $preview.removeClass('is-disabled');
                        } else {
                            $pill.removeClass('is-active').addClass('is-inactive');
                            $text.text('درگاه غیرفعال است');
                            $preview.addClass('is-disabled');
                        }
                    });

                    // Live Sync: Title & Description
                    $('#woocommerce_blupal_c2c_title').on('input', function() {
                        var val = $(this).val() || 'پرداخت کارت به کارت هوشمند (تایید آنی)';
                        $('#blupal-preview-title').text(val);
                    });

                    $('#woocommerce_blupal_c2c_description').on('input', function() {
                        var val = $(this).val() || 'انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب.';
                        $('#blupal-preview-desc').text(val);
                    });

                    // Live Test Connection Tool
                    function renderSuccessResult(data, $resultBox) {
                        var details = data.details || {};
                        var latency = data.latency_ms ? data.latency_ms + ' میلی‌ثانیه' : 'آنی';

                        var html = '<div class="blupal-alert blupal-alert-success">';
                        html += '<div class="blupal-alert-head"><span>✅ <strong>اتصال به سرور کاملاً برقرار و تایید شد!</strong></span> <span class="blupal-latency">پینگ سرور: ' + latency + '</span></div>';
                        html += '<p style="margin: 0 0 10px 0;">' + (data.message || 'ارتباط با سرور پرداخت با موفقیت برقرار شد.') + '</p>';

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
                        html += '<div class="blupal-alert-head"><span>❌ <strong>خطا در بررسی ارتباط:</strong> ' + latency + '</span></div>';
                        html += '<p style="margin: 0 0 6px 0;">' + errMsg + '</p>';
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
                            renderErrorResult({ message: 'لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات بالا وارد نمایید.' }, $resultBox);
                            return;
                        }

                        $btn.prop('disabled', true);
                        $spinner.show();
                        $btnText.text('در حال برقراری ارتباط با سرور...');
                        $resultBox.slideUp(150);

                        // 1. Standard WordPress backend AJAX
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
                                // 2. Fallback: Direct browser fetch to server test endpoint
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

            // اطمینان از دریافت آدرس معتبر صفحه پرداخت پیش از ریدایرکت مشتری.
            if (empty($result['payment_url']) || !filter_var($result['payment_url'], FILTER_VALIDATE_URL)) {
                wc_add_notice(__('آدرس صفحه پرداخت از سرور دریافت نشد. لطفاً مجدداً تلاش فرمایید.', 'wc-blupal-c2c'), 'error');
                return array('result' => 'failure');
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
            if ('yes' !== $this->enabled) {
                return false;
            }

            return parent::is_available();
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
                'httpversion' => '1.1',
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

            if (!is_array($data)) {
                return array('success' => false, 'message' => 'پاسخ نامعتبر از سرور پرداخت دریافت شد.');
            }

            if ($code < 200 || $code >= 300 || !isset($data['success']) || !$data['success']) {
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
                'httpversion' => '1.1',
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
                    'domain'     => (string) wp_parse_url($site_url, PHP_URL_HOST),
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
            $request_method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';

            // Read parameters from GET/POST and JSON body safely
            $order_id   = isset($_REQUEST['order_id']) ? sanitize_text_field(wp_unslash($_REQUEST['order_id'])) : '';
            $invoice_id = isset($_REQUEST['invoice_id']) ? sanitize_text_field(wp_unslash($_REQUEST['invoice_id'])) : '';

            $raw_input = file_get_contents('php://input');
            if (!empty($raw_input)) {
                $json = json_decode($raw_input, true);
                if (is_array($json)) {
                    if (empty($order_id) && isset($json['order_id'])) {
                        $order_id = sanitize_text_field(wp_unslash($json['order_id']));
                    }
                    if (empty($invoice_id) && isset($json['invoice_id'])) {
                        $invoice_id = sanitize_text_field(wp_unslash($json['invoice_id']));
                    }
                }
            }

            if (empty($order_id)) {
                if ('POST' === $request_method) {
                    wp_send_json_error(array('message' => 'شناسه سفارش نامعتبر است.'), 400);
                    exit;
                }
                wp_die(__('شناسه سفارش نامعتبر است.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'), array('response' => 400));
            }

            $order = wc_get_order($order_id);
            if (!$order) {
                if ('POST' === $request_method) {
                    wp_send_json_error(array('message' => 'سفارش مورد نظر یافت نشد.'), 404);
                    exit;
                }
                wp_die(__('سفارش مورد نظر یافت نشد.', 'wc-blupal-c2c'), __('خطا در پرداخت', 'wc-blupal-c2c'), array('response' => 404));
            }

            // شناسه فاکتور معتبر همیشه از متای همین سفارش خوانده می‌شود، نه از ورودی کاربر.
            $stored_invoice_id = (string) $order->get_meta('_blupal_c2c_invoice_id');

            if (empty($stored_invoice_id)) {
                if ('POST' === $request_method) {
                    wp_send_json_error(array('message' => 'فاکتور پرداختی برای این سفارش ثبت نشده است.'), 400);
                    exit;
                }
                wp_die(
                    __('فاکتور پرداختی برای این سفارش ثبت نشده است.', 'wc-blupal-c2c'),
                    __('خطا در پرداخت', 'wc-blupal-c2c'),
                    array('response' => 400)
                );
            }

            // اگر شناسه فاکتور ورودی ارسال شده، باید با فاکتور ثبت‌شده مطابقت داشته باشد.
            if (!empty($invoice_id) && !hash_equals($stored_invoice_id, (string) $invoice_id)) {
                if ('POST' === $request_method) {
                    wp_send_json_error(array('message' => 'شناسه فاکتور نامعتبر است.'), 403);
                    exit;
                }
                wp_die(
                    __('شناسه فاکتور نامعتبر است.', 'wc-blupal-c2c'),
                    __('خطا در پرداخت', 'wc-blupal-c2c'),
                    array('response' => 403)
                );
            }

            // از این پس فقط به شناسه فاکتور ذخیره‌شده اعتماد کن.
            $invoice_id = $stored_invoice_id;

            // If already paid, exit gracefully
            if ($order->is_paid()) {
                if ('POST' === $request_method) {
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
                if ('POST' === $request_method) {
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
                    // موجودی به‌صورت خودکار توسط هوک woocommerce_payment_complete کسر می‌شود.
                }

                if ('POST' === $request_method) {
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

                if ('POST' === $request_method) {
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
  return `/* Blupal Modern WordPress Admin Styles - Self Contained Zero Dependency */
.blupal-admin-wrap {
    max-width: 980px;
    margin: 20px 0 40px 0;
    direction: rtl;
    text-align: right;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", "IRANSans", Tahoma, sans-serif;
    color: #0f172a;
    box-sizing: border-box;
}
.blupal-admin-wrap * {
    box-sizing: border-box;
}
.woocommerce .form-table,
table.form-table {
    display: none !important;
}
.blupal-hero-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
    color: #ffffff;
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.25);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
}
.blupal-hero-main {
    display: flex;
    align-items: center;
    gap: 16px;
}
.blupal-hero-icon {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    flex-shrink: 0;
}
.blupal-hero-title {
    font-size: 19px;
    font-weight: 800;
    margin: 0 0 4px 0;
    color: #ffffff;
    letter-spacing: -0.02em;
}
.blupal-hero-subtitle {
    font-size: 12px;
    color: #cbd5e1;
    margin: 0;
    line-height: 1.5;
}
.blupal-hero-badges {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.blupal-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.2s ease;
}
.blupal-status-pill.is-active {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.3);
}
.blupal-status-pill.is-inactive {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
}
.blupal-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
}
.blupal-version-badge {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
}
.blupal-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 22px 26px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s, box-shadow 0.2s;
}
.blupal-card:hover {
    border-color: #cbd5e1;
}
.blupal-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
    flex-wrap: wrap;
    gap: 10px;
}
.blupal-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
}
.blupal-card-title h3 {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}
.blupal-card-icon {
    font-size: 20px;
    line-height: 1;
}
.blupal-card-desc {
    font-size: 12px;
    color: #64748b;
    margin: 0;
}
.blupal-badge-soft {
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
}
.blupal-form-group {
    margin-bottom: 20px;
}
.blupal-form-group:last-child {
    margin-bottom: 0;
}
.blupal-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
}
.blupal-label .required-star {
    color: #ef4444;
}
.blupal-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}
.blupal-input {
    width: 100%;
    height: 44px;
    padding: 8px 14px;
    font-size: 13px;
    color: #0f172a;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.blupal-input:focus,
.blupal-textarea:focus {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
    outline: none !important;
}
.blupal-input-ltr {
    direction: ltr;
    text-align: left;
    font-family: monospace, -apple-system, BlinkMacSystemFont, sans-serif;
}
.blupal-textarea {
    width: 100%;
    min-height: 84px;
    padding: 10px 14px;
    font-size: 13px;
    color: #0f172a;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    line-height: 1.6;
    transition: border-color 0.2s, box-shadow 0.2s;
    resize: vertical;
}
.blupal-btn-action {
    height: 44px;
    padding: 0 14px;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.15s ease;
}
.blupal-btn-action:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #0f172a;
}
.blupal-btn-action.is-copied {
    background: #ecfdf5 !important;
    border-color: #10b981 !important;
    color: #047857 !important;
}
.blupal-field-hint {
    font-size: 11px;
    color: #64748b;
    margin-top: 6px;
    line-height: 1.6;
}
.blupal-inline-action {
    color: #4f46e5;
    text-decoration: underline;
    cursor: pointer;
    margin-right: 6px;
    font-weight: 600;
}
.blupal-inline-action:hover {
    color: #3730a3;
}
.blupal-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.blupal-toggle-info {
    flex: 1;
}
.blupal-toggle-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px 0;
}
.blupal-toggle-desc {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.6;
}
.blupal-switch {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
}
.blupal-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
}
.blupal-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 34px;
}
.blupal-slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
.blupal-switch input:checked + .blupal-slider {
    background-color: #10b981;
}
.blupal-switch input:checked + .blupal-slider:before {
    transform: translateX(24px);
}
.blupal-notice-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 18px;
    margin-top: 14px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.blupal-notice-icon {
    font-size: 18px;
    line-height: 1;
    margin-top: 2px;
}
.blupal-notice-content {
    font-size: 12px;
    color: #334155;
    line-height: 1.7;
}
.blupal-notice-content strong {
    color: #0f172a;
}
.blupal-notice-content code {
    background: #e2e8f0;
    color: #1e1b4b;
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 700;
}
.blupal-test-container {
    background: #faf5ff;
    border: 1px solid #e9d5ff;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
}
.blupal-test-header-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
}
.blupal-test-intro {
    display: flex;
    align-items: center;
    gap: 12px;
}
.blupal-test-intro-icon {
    width: 40px;
    height: 40px;
    background: #f3e8ff;
    color: #9333ea;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}
.blupal-test-intro-text strong {
    display: block;
    font-size: 14px;
    color: #581c87;
    margin-bottom: 2px;
}
.blupal-test-intro-text p {
    margin: 0;
    font-size: 11px;
    color: #7e22ce;
}
.blupal-btn-test {
    background: #7c3aed !important;
    border: 1px solid #6d28d9 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    padding: 10px 20px !important;
    height: auto !important;
    border-radius: 10px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25) !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}
.blupal-btn-test:hover {
    background: #6d28d9 !important;
    transform: translateY(-1px);
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
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px dashed #d8b4fe;
}
.blupal-alert {
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 12px;
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
    font-size: 13px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
}
.blupal-latency {
    font-size: 11px;
    font-weight: 700;
    background: #dcfce7;
    color: #15803d;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid #86efac;
}
.blupal-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    background: #ffffff;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
}
.blupal-grid-item {
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.blupal-grid-item span {
    color: #64748b;
    font-size: 10px;
}
.blupal-troubleshoot-hint {
    background: #ffffff;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #fecaca;
    font-size: 11px;
    color: #7f1d1d;
    margin-top: 8px;
}
.blupal-preview-wrap {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin-top: 14px;
}
.blupal-preview-header {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.blupal-checkout-mock {
    background: #ffffff;
    border: 2px solid #4f46e5;
    border-radius: 10px;
    padding: 14px 16px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    transition: opacity 0.2s;
}
.blupal-checkout-mock.is-disabled {
    opacity: 0.45;
    border-color: #cbd5e1;
}
.blupal-mock-radio-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.blupal-mock-radio-left {
    display: flex;
    align-items: center;
    gap: 10px;
}
.blupal-mock-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 5px solid #4f46e5;
    background: #ffffff;
    flex-shrink: 0;
}
.blupal-mock-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
}
.blupal-mock-icon {
    height: 24px;
    width: auto;
}
.blupal-mock-desc-box {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    margin-top: 10px;
    padding-top: 10px;
    font-size: 12px;
    color: #475569;
    line-height: 1.6;
}
.blupal-specs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-top: 14px;
}
.blupal-spec-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
}
.blupal-spec-card strong {
    display: block;
    font-size: 12px;
    color: #1e293b;
    margin-bottom: 4px;
}
.blupal-spec-card p {
    font-size: 11px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
}
p.submit {
    margin: 24px 0 0 0 !important;
    padding: 0 !important;
}
p.submit .button-primary,
p.submit .woocommerce-save-button {
    background: #4f46e5 !important;
    border: 1px solid #4338ca !important;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    padding: 12px 32px !important;
    height: auto !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3) !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}
p.submit .button-primary:hover,
p.submit .woocommerce-save-button:hover {
    background: #4338ca !important;
    transform: translateY(-1px);
}
@media (max-width: 782px) {
    .blupal-admin-wrap {
        margin: 10px 0 30px 0;
    }
    .blupal-hero-banner {
        padding: 18px 18px;
        border-radius: 12px;
    }
    .blupal-hero-title {
        font-size: 16px;
    }
    .blupal-card {
        padding: 18px 16px;
        border-radius: 12px;
    }
    .blupal-toggle-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .blupal-switch {
        align-self: flex-end;
    }
    .blupal-input-wrap {
        flex-direction: column;
        align-items: stretch;
    }
    .blupal-btn-action {
        width: 100%;
    }
    .blupal-test-header-wrap {
        flex-direction: column;
        align-items: stretch;
    }
    .blupal-btn-test {
        width: 100%;
        justify-content: center;
    }
    p.submit .button-primary,
    p.submit .woocommerce-save-button {
        width: 100% !important;
        text-align: center !important;
    }
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
"POT-Creation-Date: 2026-09-28 12:00+0000\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: \\n"
"Language-Team: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: Poedit 3.0\\n"

msgid "درگاه پرداخت کارت به کارت هوشمند:"
msgstr ""

msgid "برای استفاده از این درگاه، افزونه ووکامرس (WooCommerce) باید نصب و فعال باشد."
msgstr ""

msgid "پیکربندی درگاه"
msgstr ""

msgid "اعتبار نشست کاری به پایان رسیده است. لطفاً صفحه را رفرش فرمایید."
msgstr ""

msgid "دسترسی غیرمجاز. فقط مدیران فروشگاه امکان بررسی اتصال را دارند."
msgstr ""

msgid "لطفاً ابتدا آدرس سرور (API Base URL) را در کادر تنظیمات وارد نمایید."
msgstr ""

msgid "لطفاً ابتدا کلید اختصاصی اتصال (API Key) را در کادر تنظیمات وارد نمایید."
msgstr ""

msgid "پرداخت کارت به کارت هوشمند"
msgstr ""

msgid "پرداخت مستقیم به شماره کارت پذیرنده با استعلام خودکار و آنی واریزی از طریق سامانه شتاب."
msgstr ""

msgid "پرداخت کارت به کارت هوشمند (تایید آنی)"
msgstr ""

msgid "انتقال وجه کارت به کارت با تایید خودکار و لحظه‌ای از شبکه شتاب."
msgstr ""

msgid "فعال‌سازی درگاه"
msgstr ""

msgid "فعال‌سازی پرداخت کارت به کارت هوشمند در برگه تسویه حساب"
msgstr ""

msgid "عنوان درگاه در برگه تسویه حساب"
msgstr ""

msgid "عنوانی که خریدار در مرحله پرداخت مشاهده می‌کند."
msgstr ""

msgid "توضیحات درگاه برای مشتری"
msgstr ""

msgid "آدرس وب‌سرویس / سرور پرداخت (API Base URL)"
msgstr ""

msgid "کلید اختصاصی اتصال (API Key)"
msgstr ""

msgid "سفارش مورد نظر یافت نشد."
msgstr ""

msgid "کلید درگاه کارت به کارت در تنظیمات ووکامرس پیکربندی نشده است."
msgstr ""

msgid "خطا در صدور فاکتور پرداخت."
msgstr ""

msgid "آدرس صفحه پرداخت از سرور دریافت نشد. لطفاً مجدداً تلاش فرمایید."
msgstr ""

msgid "شناسه سفارش نامعتبر است."
msgstr ""

msgid "فاکتور پرداختی برای این سفارش ثبت نشده است."
msgstr ""

msgid "شناسه فاکتور نامعتبر است."
msgstr ""

msgid "خطا در استعلام وضعیت پرداخت از سرور کارت به کارت: "
msgstr ""

msgid "خطا در اعتبارسنجی پرداخت. در صورت کسر وجه با پشتیبانی تماس بگیرید."
msgstr ""

msgid "پرداخت کارت به کارت با موفقیت تایید شد. کد رهگیری شتاب: %s | شناسه فاکتور: %s"
msgstr ""

msgid "۴ رقم آخر کارت واریزکننده: %s"
msgstr ""

msgid "پرداخت کارت به کارت تایید نشد یا منقضی گردید."
msgstr ""

msgid "پرداخت کارت به کارت تایید نشد یا زمان واریز به پایان رسید. لطفاً مجدداً تلاش فرمایید."
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
│   ├── class-blupal-webhook.php      (پردازش تایید بازگشت و وب‌هوک سفارش)
│   └── class-blupal-blocks-support.php (پشتیبانی از تسویه حساب بلوکی ووکامرس)
├── assets/
│   ├── css/
│   │   └── admin.css                 (استایل‌های پیشخوان ووکامرس)
│   ├── js/
│   │   └── blocks.js                 (اسکریپت تسویه حساب بلوکی ووکامرس)
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
                array('wc-blocks-registry', 'wc-settings', 'wp-element', 'wp-i18n'),
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


