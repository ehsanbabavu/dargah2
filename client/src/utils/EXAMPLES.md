# 🎓 مثال‌های کاربردی استفاده از Utils

این فایل شامل مثال‌های واقعی از نحوه استفاده از utils در کامپوننت‌های موجود است.

---

## ✅ مثال ۱: تبدیل کامپوننت Orders برای استفاده از Utils

### ❌ قبل (کد قدیمی):

```typescript
// client/src/pages/user/orders.tsx

// تابع محلی تعریف شده در کامپوننت
const formatPrice = (price: number | string) => {
  return new Intl.NumberFormat('fa-IR').format(Number(price)) + ' تومان';
};

// تابع محلی تبدیل عدد به حروف (۵۰+ خط کد!)
const numberToPersianWords = (num: number): string => {
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  // ... ۴۰ خط دیگر ...
};
```

### ✅ بعد (کد جدید با Utils):

```typescript
// client/src/pages/user/orders.tsx

import { formatPriceRial, numberToPersianWords } from '@/utils';

// حذف توابع محلی - استفاده مستقیم از utils!
// دیگر نیازی به تعریف این توابع نیست

// استفاده در کامپوننت:
<p>قیمت: {formatPriceRial(totalAmount)} تومان</p>
<p>به حروف: {numberToPersianWords(Math.floor(totalAmount))} ریال</p>
```

**مزایا:**
- ✅ حذف ۵۰+ خط کد تکراری
- ✅ کد تمیزتر و خواناتر
- ✅ قابل استفاده مجدد در سایر کامپوننت‌ها

---

## ✅ مثال ۲: فرم ثبت نام کاربر با اعتبارسنجی

### کد کامل:

```typescript
// client/src/pages/register.tsx

import { useState } from 'react';
import { 
  validatePhoneNumber, 
  validateEmail, 
  validatePassword,
  generateUsernameFromPhone,
  persianToEnglish 
} from '@/utils';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    username: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      phone,
      // تولید خودکار یوزرنیم از شماره تلفن
      username: generateUsernameFromPhone(phone)
    }));
    
    // اعتبارسنجی فوری
    const normalized = persianToEnglish(phone);
    if (!validatePhoneNumber(normalized)) {
      setErrors(prev => ({ ...prev, phone: 'شماره تلفن نامعتبر است' }));
    } else {
      setErrors(prev => ({ ...prev, phone: null }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // نرمالیزاسیون و اعتبارسنجی نهایی
    const normalized = {
      ...formData,
      phone: persianToEnglish(formData.phone)
    };
    
    // چک کردن همه validation ها
    const validationErrors = {};
    
    if (!validatePhoneNumber(normalized.phone)) {
      validationErrors.phone = 'شماره تلفن معتبر نیست';
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      validationErrors.email = 'ایمیل معتبر نیست';
    }
    
    if (!validatePassword(formData.password, 6)) {
      validationErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // ارسال به سرور
    // ...
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* فرم ... */}
    </form>
  );
}
```

---

## ✅ مثال ۳: نمایش محصول با محاسبه تخفیف

### کد کامل:

```typescript
// client/src/components/ProductCard.tsx

import { 
  formatPriceRial, 
  calculateDiscountPercentage,
  calculateDiscountAmount 
} from '@/utils';

interface ProductCardProps {
  product: {
    name: string;
    priceBeforeDiscount: string;
    priceAfterDiscount?: string;
    image?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const originalPrice = parseFloat(product.priceBeforeDiscount);
  const discountPrice = product.priceAfterDiscount 
    ? parseFloat(product.priceAfterDiscount) 
    : null;
  
  // محاسبه خودکار درصد و مبلغ تخفیف
  const discountPercent = discountPrice 
    ? calculateDiscountPercentage(originalPrice, discountPrice)
    : 0;
    
  const discountAmount = discountPrice
    ? calculateDiscountAmount(originalPrice, discountPrice)
    : 0;
  
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      
      <div className="price-section">
        {discountPercent > 0 ? (
          <>
            {/* قیمت با تخفیف */}
            <p className="discounted-price text-2xl font-bold text-green-600">
              {formatPriceRial(discountPrice!)} تومان
            </p>
            
            {/* قیمت اصلی خط خورده */}
            <p className="original-price line-through text-gray-500">
              {formatPriceRial(originalPrice)} تومان
            </p>
            
            {/* بج تخفیف */}
            <span className="discount-badge bg-red-500 text-white px-2 py-1 rounded">
              {discountPercent}% تخفیف
            </span>
            
            {/* مبلغ صرفه‌جویی */}
            <p className="saving text-sm text-gray-600">
              شما {formatPriceRial(discountAmount)} تومان صرفه‌جویی می‌کنید
            </p>
          </>
        ) : (
          <p className="price text-2xl font-bold">
            {formatPriceRial(originalPrice)} تومان
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ مثال ۵: جستجوی محصولات با نرمالیزاسیون

### کد کامل:

```typescript
// client/src/pages/products.tsx

import { useState } from 'react';
import { normalizeText } from '@/utils';

export default function ProductsPage() {
  const { data: products = [] } = useQuery({ queryKey: ['/api/products'] });
  const [searchQuery, setSearchQuery] = useState('');
  
  // فیلتر محصولات با نرمالیزاسیون متن
  const filteredProducts = products.filter(product => {
    const normalizedQuery = normalizeText(searchQuery);
    const normalizedName = normalizeText(product.name);
    const normalizedDesc = normalizeText(product.description || '');
    
    return normalizedName.includes(normalizedQuery) || 
           normalizedDesc.includes(normalizedQuery);
  });
  
  return (
    <div>
      <input 
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="جستجوی محصولات..."
      />
      
      <div className="products-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <p>هیچ محصولی یافت نشد</p>
      )}
    </div>
  );
}
```

**مزایا:**
- ✅ جستجو بدون توجه به ي/ی و ك/ک
- ✅ جستجو بدون توجه به اعراب و فاصله‌های اضافی
- ✅ نتایج بهتر برای کاربران فارسی‌زبان

---

## ✅ مثال ۶: فرم افزودن آدرس با اعتبارسنجی کد پستی

### کد کامل:

```typescript
// client/src/pages/user/addresses.tsx

import { 
  validatePhoneNumber, 
  validatePostalCode,
  persianToEnglish 
} from '@/utils';

export default function AddressForm() {
  const [formData, setFormData] = useState({
    recipientPhone: '',
    postalCode: '',
    fullAddress: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handlePostalCodeChange = (e) => {
    let value = e.target.value;
    
    // تبدیل خودکار اعداد فارسی به انگلیسی
    value = persianToEnglish(value);
    
    setFormData(prev => ({ ...prev, postalCode: value }));
    
    // اعتبارسنجی فوری
    if (value && !validatePostalCode(value)) {
      setErrors(prev => ({ 
        ...prev, 
        postalCode: 'کد پستی باید ۱۰ رقم باشد' 
      }));
    } else {
      setErrors(prev => ({ ...prev, postalCode: null }));
    }
  };
  
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = persianToEnglish(value);
    
    setFormData(prev => ({ ...prev, recipientPhone: value }));
    
    if (value && !validatePhoneNumber(value)) {
      setErrors(prev => ({ 
        ...prev, 
        recipientPhone: 'شماره تلفن نامعتبر است' 
      }));
    } else {
      setErrors(prev => ({ ...prev, recipientPhone: null }));
    }
  };
  
  return (
    <form>
      <div>
        <label>شماره تلفن گیرنده</label>
        <input 
          type="text"
          value={formData.recipientPhone}
          onChange={handlePhoneChange}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        />
        {errors.recipientPhone && (
          <span className="error">{errors.recipientPhone}</span>
        )}
      </div>
      
      <div>
        <label>کد پستی</label>
        <input 
          type="text"
          value={formData.postalCode}
          onChange={handlePostalCodeChange}
          placeholder="۱۲۳۴۵۶۷۸۹۰"
          maxLength={10}
        />
        {errors.postalCode && (
          <span className="error">{errors.postalCode}</span>
        )}
      </div>
      
      {/* سایر فیلدها ... */}
    </form>
  );
}
```

---

## 📊 خلاصه مزایا

| قبل | بعد |
|-----|-----|
| ❌ تعریف مجدد توابع در هر کامپوننت | ✅ استفاده از یک منبع واحد |
| ❌ کد تکراری و طولانی | ✅ کد کوتاه و خوانا |
| ❌ احتمال خطا در پیاده‌سازی | ✅ توابع تست شده و قابل اطمینان |
| ❌ بدون مستندات | ✅ مستندات کامل JSDoc |
| ❌ بدون type safety | ✅ کاملاً type-safe با TypeScript |

---

## 🚀 توصیه‌های بعدی

1. **جایگزینی تدریجی**: ابتدا کامپوننت‌هایی که بیشترین استفاده را دارند، تبدیل کنید
2. **تست کردن**: بعد از هر تغییر، عملکرد را تست کنید
3. **حذف کدهای قدیمی**: بعد از اطمینان از عملکرد صحیح، کدهای تکراری را حذف کنید
4. **افزودن توابع جدید**: در صورت نیاز، توابع جدید به utils اضافه کنید

**سوال دارید؟ نیاز به کمک برای تبدیل کامپوننت خاصی دارید؟ 😊**
