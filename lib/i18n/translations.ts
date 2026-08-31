export type Language = 'en' | 'ar';

export interface Translations {
  // Navigation & Header
  announcement: {
    wholesale: string;
    shipping: string;
    fabrics: string;
  };
  nav: {
    home: string;
    collections: string;
    newIn: string;
    bestSellers: string;
    aboutUs: string;
    contact: string;
    wishlist: string;
    cart: string;
    account: string;
    myOrders: string;
    adminPortal: string;
    logout: string;
    searchPlaceholder: string;
    installApp: string;
    language: string;
  };
  // Mobile Tab Bar
  tabBar: {
    home: string;
    shop: string;
    bag: string;
    wishlist: string;
    account: string;
  };
  // Hero Section
  hero: {
    tagline: string;
    headlinePart1: string;
    headlinePart2: string;
    description: string;
    shopCollection: string;
    newArrivals: string;
    guarantee1: string;
    guarantee2: string;
    guarantee3: string;
    guarantee4: string;
  };
  // Category Section
  categories: {
    subtitle: string;
    title: string;
    explore: string;
    piecesCount: string;
  };
  // Product Page & Cards
  product: {
    sale: string;
    newIn: string;
    quickAdd: string;
    added: string;
    addToCart: string;
    outOfStock: string;
    inStock: string;
    selectColor: string;
    selectSize: string;
    quantity: string;
    save: string;
    flashDeal: string;
    flashDealEndsIn: string;
    days: string;
    hours: string;
    mins: string;
    secs: string;
    tabs: {
      fabricAndFit: string;
      delivery: string;
      wholesale: string;
    };
    guarantees: {
      cod: string;
      inspect: string;
      exchange: string;
      egyptCraft: string;
    };
    relatedTitle: string;
    relatedSubtitle: string;
  };
  // Cart Drawer
  cart: {
    title: string;
    itemsCount: string;
    emptyTitle: string;
    emptySubtitle: string;
    explorePieces: string;
    subtotal: string;
    autoDiscount: string;
    voucherDiscount: string;
    estimatedTotal: string;
    shippingNote: string;
    checkoutBtn: string;
    continueShopping: string;
    remove: string;
  };
  // Checkout Page
  checkout: {
    title: string;
    subtitle: string;
    backToCart: string;
    customerInfo: string;
    fullName: string;
    fullNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    alternatePhone: string;
    alternatePhonePlaceholder: string;
    governorate: string;
    selectGovernorate: string;
    city: string;
    selectCity: string;
    address: string;
    addressPlaceholder: string;
    orderNotes: string;
    orderNotesPlaceholder: string;
    deliveryDetails: string;
    deliveryMethod: string;
    standardDelivery: string;
    paymentMethod: string;
    cashOnDelivery: string;
    cashOnDeliveryDesc: string;
    orderSummary: string;
    promoCode: string;
    applyCode: string;
    promoPlaceholder: string;
    freeShippingNotice: string;
    shippingFee: string;
    free: string;
    total: string;
    placeOrderBtn: string;
    processing: string;
    codNote: string;
  };
  // Order Confirmation Page
  orderConfirmation: {
    successBadge: string;
    badge: string;
    title: string;
    thankYou: string;
    subtitle: string;
    orderNumber: string;
    status: string;
    deliveryTo: string;
    deliveryDestination: string;
    paymentType: string;
    paymentSummary: string;
    estimatedDelivery: string;
    summary: string;
    codDue: string;
    itemsOrdered: string;
    printReceipt: string;
    timelineTitle: string;
    needHelp: string;
    whatsappUs: string;
    whatsappSupport: string;
    backToHome: string;
  };
  // Wishlist Page
  wishlist: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    exploreBtn: string;
    moveToBag: string;
    remove: string;
  };
  // Account Page
  account: {
    title: string;
    subtitle: string;
    profile: string;
    orders: string;
    noOrders: string;
    noOrdersSubtitle: string;
    orderDate: string;
    totalAmount: string;
    status: string;
    viewDetails: string;
    installAppBanner: string;
    installAppDesc: string;
    installBtn: string;
    logout: string;
  };
  // Footer
  footer: {
    aboutText: string;
    collections: string;
    customerCare: string;
    contactUs: string;
    contactText: string;
    shippingPolicy: string;
    returnPolicy: string;
    sizeGuide: string;
    faq: string;
    rights: string;
    madeInEgypt: string;
  };
  // PWA Modal
  pwa: {
    appTitle: string;
    appPill: string;
    appDesc: string;
    getApp: string;
    officialApp: string;
    appSubtitle: string;
    featureSpeed: string;
    featureSpeedDesc: string;
    featurePerks: string;
    featurePerksDesc: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    installButton: string;
    continueBrowser: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    announcement: {
      wholesale: '✦ WHOLESALE & RETAIL',
      shipping: 'FAST SHIPPING ACROSS EGYPT',
      fabrics: 'PREMIUM QUALITY FABRICS ✦',
    },
    nav: {
      home: 'HOME',
      collections: 'COLLECTIONS',
      newIn: 'NEW IN',
      bestSellers: 'BEST SELLERS',
      aboutUs: 'ABOUT US',
      contact: 'CONTACT',
      wishlist: 'Wishlist',
      cart: 'Shopping Bag',
      account: 'Account',
      myOrders: 'My Orders',
      adminPortal: 'Admin Portal',
      logout: 'Sign Out',
      searchPlaceholder: 'Search luxury collections, dresses, linen sets...',
      installApp: 'Install Mobile App',
      language: 'Language',
    },
    tabBar: {
      home: 'Home',
      shop: 'Shop',
      bag: 'Bag',
      wishlist: 'Wishlist',
      account: 'Account',
    },
    hero: {
      tagline: 'LUXURY ATELIER & BOUTIQUE',
      headlinePart1: 'Design for',
      headlinePart2: 'Your Style',
      description:
        'Step into refined elegance with handcrafted silhouettes, organic linen blends, and timeless evening pieces designed to elevate every moment.',
      shopCollection: 'Explore Collections',
      newArrivals: 'New Arrivals',
      guarantee1: 'Doorstep COD in Egypt',
      guarantee2: 'Inspect Before Payment',
      guarantee3: '14-Day Free Exchange',
      guarantee4: 'Handcrafted Egyptian Quality',
    },
    categories: {
      subtitle: 'CURATED WARDROBE',
      title: 'DISCOVER OUR COLLECTIONS',
      explore: 'Explore Collection',
      piecesCount: 'Pieces',
    },
    product: {
      sale: 'Special Offer',
      newIn: 'New Arrival',
      quickAdd: 'Quick Add',
      added: 'Added',
      addToCart: 'Add to Shopping Bag',
      outOfStock: 'Out of Stock',
      inStock: 'In Stock',
      selectColor: 'Color',
      selectSize: 'Size',
      quantity: 'Quantity',
      save: 'Save',
      flashDeal: 'FLASH DEAL',
      flashDealEndsIn: 'Offer Ends In:',
      days: 'Days',
      hours: 'Hours',
      mins: 'Mins',
      secs: 'Secs',
      tabs: {
        fabricAndFit: 'Fabric & Fit',
        delivery: 'Delivery & COD',
        wholesale: 'Wholesale Concierge',
      },
      guarantees: {
        cod: 'Doorstep COD Delivery',
        inspect: 'Inspection before paying',
        exchange: '14-day exchange policy',
        egyptCraft: 'Handcrafted in Egypt',
      },
      relatedTitle: 'YOU MAY ALSO ADORE',
      relatedSubtitle: 'Complete Your Look',
    },
    cart: {
      title: 'Shopping Bag',
      itemsCount: 'Items',
      emptyTitle: 'Your shopping bag is empty',
      emptySubtitle: 'Explore our latest collections and find timeless pieces to elevate your style.',
      explorePieces: 'Explore Collections',
      subtotal: 'Subtotal',
      autoDiscount: 'Auto Discount Applied',
      voucherDiscount: 'Promo Voucher Applied',
      estimatedTotal: 'Estimated Total',
      shippingNote: 'Shipping and delivery rates calculated at checkout.',
      checkoutBtn: 'Proceed to Checkout',
      continueShopping: 'Continue Browsing',
      remove: 'Remove',
    },
    checkout: {
      title: 'Checkout & Delivery',
      subtitle: 'Complete your order with Cash on Delivery across Egypt.',
      backToCart: 'Return to Cart',
      customerInfo: '1. Customer Details',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'Enter your full name',
      phone: 'Phone Number (Primary) *',
      phonePlaceholder: '01XXXXXXXXX',
      alternatePhone: 'Alternate Phone (Optional)',
      alternatePhonePlaceholder: 'Second contact number',
      governorate: 'Governorate *',
      selectGovernorate: 'Select Governorate',
      city: 'City / District *',
      selectCity: 'Select City to calculate delivery rate',
      address: 'Detailed Street Address *',
      addressPlaceholder: 'Building number, street name, apartment / floor...',
      orderNotes: 'Delivery Notes (Optional)',
      orderNotesPlaceholder: 'Any special delivery instructions...',
      deliveryDetails: '2. Shipping & Delivery',
      deliveryMethod: 'Doorstep Courier Delivery',
      standardDelivery: 'Express COD Delivery',
      paymentMethod: '3. Payment Method',
      cashOnDelivery: 'Cash on Delivery (COD)',
      cashOnDeliveryDesc: 'Pay securely in cash upon receiving and inspecting your package.',
      orderSummary: 'Order Summary',
      promoCode: 'Promo Code / Gift Voucher',
      applyCode: 'Apply',
      promoPlaceholder: 'Enter promo code (e.g. WELCOME10)',
      freeShippingNotice: '🎉 Congratulations! You have unlocked Free Shipping.',
      shippingFee: 'Delivery Fee',
      free: 'FREE',
      total: 'Total Amount',
      placeOrderBtn: 'Confirm Order (Cash on Delivery)',
      processing: 'Processing Order...',
      codNote: 'No credit card needed. You pay the courier upon delivery.',
    },
    orderConfirmation: {
      successBadge: 'ORDER PLACED SUCCESSFULLY',
      badge: 'Cash on Delivery Order Confirmed',
      title: 'Thank You for Your Order!',
      thankYou: 'Thank you for choosing ARMIA Boutique',
      subtitle: 'We are preparing your handcrafted garments. Our delivery team will contact you shortly.',
      orderNumber: 'Order Number',
      status: 'Status',
      deliveryTo: 'Delivering To',
      deliveryDestination: 'Delivery Destination',
      paymentType: 'Payment Method',
      paymentSummary: 'Payment & COD Total',
      estimatedDelivery: 'Estimated Delivery Time',
      summary: 'Order Summary',
      codDue: 'Cash on Delivery Due',
      itemsOrdered: 'Items In Order',
      printReceipt: 'Print Receipt',
      timelineTitle: 'Live Delivery Tracking',
      needHelp: 'Need assistance with your order?',
      whatsappUs: 'Contact Concierge on WhatsApp',
      whatsappSupport: 'WhatsApp Support',
      backToHome: 'Back to Homepage',
    },
    wishlist: {
      title: 'My Wishlist',
      subtitle: 'Curated pieces you have saved for your wardrobe.',
      emptyTitle: 'Your wishlist is empty',
      emptySubtitle: 'Save your favorite dresses, sets, and outerwear by clicking the heart icon on any piece.',
      exploreBtn: 'Explore Collections',
      moveToBag: 'Move to Shopping Bag',
      remove: 'Remove',
    },
    account: {
      title: 'My Account & Orders',
      subtitle: 'Manage your profile and track recent purchases.',
      profile: 'Customer Profile',
      orders: 'Order History',
      noOrders: 'No orders found yet',
      noOrdersSubtitle: 'Once you complete a purchase, your orders and tracking status will appear here.',
      orderDate: 'Date',
      totalAmount: 'Total',
      status: 'Status',
      viewDetails: 'View Invoice',
      installAppBanner: 'ARMIA Mobile App',
      installAppDesc: 'Install our dedicated app for offline access and instant drop alerts.',
      installBtn: 'Install App',
      logout: 'Sign Out',
    },
    footer: {
      aboutText:
        'ARMIA Boutique is dedicated to creating timeless, elegant, and versatile feminine fashion. Carefully selected fabrics and tailored silhouettes designed to elevate your everyday style.',
      collections: 'Collections',
      customerCare: 'Customer Care',
      contactUs: 'Get in Touch',
      contactText: 'Concierge available 7 days a week for styling advice, orders, and wholesale inquiries.',
      shippingPolicy: 'Shipping & Delivery Policy',
      returnPolicy: '14-Day Exchange & Returns',
      sizeGuide: 'Size Guide',
      faq: 'Frequently Asked Questions',
      rights: 'All rights reserved.',
      madeInEgypt: 'Designed & Handcrafted in Egypt',
    },
    pwa: {
      appTitle: 'ARMIA Boutique App',
      appPill: 'PWA',
      appDesc: 'Install for instant shopping & VIP discounts',
      getApp: 'Get',
      officialApp: 'Official Mobile Application',
      appSubtitle: 'Experience high fashion with instant offline catalog access, 1-tap COD checkout, and order tracking.',
      featureSpeed: 'Instant Speed',
      featureSpeedDesc: 'Zero lag and offline shopping bag saving.',
      featurePerks: 'VIP Perks',
      featurePerksDesc: 'Auto-applied promotions & drop alerts.',
      iosTitle: 'Install on iPhone / iPad (Safari):',
      iosStep1: 'Tap the Share button in Safari toolbar.',
      iosStep2: 'Scroll down and tap "Add to Home Screen".',
      iosStep3: 'Tap "Add" in the top right corner to finish.',
      installButton: 'Install ARMIA App to Home Screen',
      continueBrowser: 'Continue in Browser',
    },
  },
  ar: {
    announcement: {
      wholesale: '✦ متاح للبيع بالجملة والقطاعي',
      shipping: 'شحن سريع لجميع محافظات مصر',
      fabrics: 'أقمشة فاخرة بجودة استثنائية ✦',
    },
    nav: {
      home: 'الرئيسية',
      collections: 'المجموعات',
      newIn: 'وصل حديثاً',
      bestSellers: 'الأكثر مبيعاً',
      aboutUs: 'عن أرميا',
      contact: 'تواصل معنا',
      wishlist: 'المفضلة',
      cart: 'حقيبة التسوق',
      account: 'حسابي',
      myOrders: 'طلباتي',
      adminPortal: 'لوحة الإدارة',
      logout: 'تسجيل الخروج',
      searchPlaceholder: 'ابحث عن الفساتين الفاخرة، أطقم الكتان، العبايات...',
      installApp: 'تثبيت تطبيق الهاتف',
      language: 'اللغة',
    },
    tabBar: {
      home: 'الرئيسية',
      shop: 'المجموعات',
      bag: 'الحقيبة',
      wishlist: 'المفضلة',
      account: 'حسابي',
    },
    hero: {
      tagline: 'أتيليه وبوتيك أرميا الفاخر',
      headlinePart1: 'تصميم يليق',
      headlinePart2: 'بأناقتك وذوقك',
      description:
        'تألقي بأرقى التصاميم الأنثوية المحاكة يدوياً من أفخر أقمشة الكتان الطبيعي والحرير، صُممت لتمنحك إطلالة فريدة في كل مناسبة.',
      shopCollection: 'تصفحي المجموعات',
      newArrivals: 'أحدث التشكيلات',
      guarantee1: 'دفع عند الاستلام بجميع المحافظات',
      guarantee2: 'معاينة المنتج قبل الدفع',
      guarantee3: 'استبدال واسترجاع خلال 14 يوماً',
      guarantee4: 'صناعة يدوية مصرية فائقة الجودة',
    },
    categories: {
      subtitle: 'خزانة مفعمة بالأناقة',
      title: 'اكتشفي تشكيلاتنا الحصرية',
      explore: 'تصفحي التشكيلة',
      piecesCount: 'قطعة متوفرة',
    },
    product: {
      sale: 'عرض خاص',
      newIn: 'وصل حديثاً',
      quickAdd: 'إضافة سريعة',
      added: 'تمت الإضافة',
      addToCart: 'إضافة إلى حقيبة التسوق',
      outOfStock: 'نفد من المخزون',
      inStock: 'متوفر بالمخزون',
      selectColor: 'اللون',
      selectSize: 'المقاس',
      quantity: 'الكمية',
      save: 'وفرت',
      flashDeal: 'عرض محدود',
      flashDealEndsIn: 'ينتهي العرض خلال:',
      days: 'أيام',
      hours: 'ساعات',
      mins: 'دقائق',
      secs: 'ثوانٍ',
      tabs: {
        fabricAndFit: 'الخامة والمقاس',
        delivery: 'الشحن والدفع عند الاستلام',
        wholesale: 'خدمة طلبات الجملة',
      },
      guarantees: {
        cod: 'توصيل لباب المنزل والدفع عند الاستلام',
        inspect: 'حق المعاينة وفتح الشحنة قبل الدفع',
        exchange: 'سياسة استبدال مرنة خلال 14 يوماً',
        egyptCraft: 'صُنع بحرفية وفخر في مصر',
      },
      relatedTitle: 'قطع أخرى قد تنال إعجابك',
      relatedSubtitle: 'أكملي أناقة إطلالتك',
    },
    cart: {
      title: 'حقيبة التسوق',
      itemsCount: 'قطع',
      emptyTitle: 'حقيبة التسوق فارغة حالياً',
      emptySubtitle: 'استكشفي أحدث تشكيلاتنا واختاري قطعك المفضلة لتتألقي بأسلوب لا يُضاهى.',
      explorePieces: 'تصفحي التشكيلات',
      subtotal: 'المجموع الفرعي',
      autoDiscount: 'خصم تلقائي مطبق',
      voucherDiscount: 'كوبون الخصم المطبق',
      estimatedTotal: 'الإجمالي التقديري',
      shippingNote: 'يتم احتساب رسوم التوصيل تلقائياً في صفحة إتمام الطلب.',
      checkoutBtn: 'المتابعة لإتمام الطلب',
      continueShopping: 'متابعة التسوق',
      remove: 'حذف',
    },
    checkout: {
      title: 'إتمام الطلب وتحديد التوصيل',
      subtitle: 'أدخلي بياناتك وسنصلك أينما كنتِ في مصر مع ميزة الدفع عند الاستلام.',
      backToCart: 'العودة للحقيبة',
      customerInfo: '1. بيانات العميل',
      fullName: 'الاسم بالكامل *',
      fullNamePlaceholder: 'اكتبي اسمك بالكامل',
      phone: 'رقم الهاتف الأساسي *',
      phonePlaceholder: '01XXXXXXXXX',
      alternatePhone: 'رقم هاتف إضافي (اختياري)',
      alternatePhonePlaceholder: 'رقم للتواصل الإضافي إن وجد',
      governorate: 'المحافظة *',
      selectGovernorate: 'اختاري المحافظة',
      city: 'المدينة / المنطقة *',
      selectCity: 'اختاري المدينة لاحتساب سعر الشحن الدقيق',
      address: 'العنوان بالتفصيل *',
      addressPlaceholder: 'رقم العمارة، اسم الشارع، الشقة / الدور أو أي علامة مميزة...',
      orderNotes: 'ملاحظات للتوصيل (اختياري)',
      orderNotesPlaceholder: 'أي تفاصيل خاصة بتوقيت أو عنوان الاستلام...',
      deliveryDetails: '2. الشحن والتوصيل',
      deliveryMethod: 'شحن سريع عبر المندوب',
      standardDelivery: 'توصيل لباب المنزل مع المعاينة',
      paymentMethod: '3. طريقة الدفع',
      cashOnDelivery: 'الدفع نقداً عند الاستلام (COD)',
      cashOnDeliveryDesc: 'ادفعي بأمان للمندوب بعد استلام ومعاينة الشحنة بالكامل.',
      orderSummary: 'ملخص الطلب',
      promoCode: 'كود الخصم أو القسيمة الشرائية',
      applyCode: 'تطبيق',
      promoPlaceholder: 'أدخلي كود الخصم (مثال: WELCOME10)',
      freeShippingNotice: '🎉 مبروك! حصلتِ على شحن مجاني لطلبك.',
      shippingFee: 'رسوم الشحن',
      free: 'مجاناً',
      total: 'المبلغ الإجمالي',
      placeOrderBtn: 'تأكيد الطلب (الدفع عند الاستلام)',
      processing: 'جاري تأكيد وتسجيل الطلب...',
      codNote: 'لا يتطلب دفع إلكتروني أو بطاقة بنكية. الدفع نقداً عند باب منزلك.',
    },
    orderConfirmation: {
      successBadge: 'تم تسجيل طلبك بنجاح',
      badge: 'تم تأكيد طلب الدفع عند الاستلام',
      title: 'شكراً لثقتك في أرميا بوتيك!',
      thankYou: 'شكراً لاختيارك أرميا بوتيك',
      subtitle: 'نقوم حالياً بتجهيز وتغليف قطعك الفاخرة بعناية، وسيتواصل معك المندوب قريباً للتوصيل.',
      orderNumber: 'رقم الطلب',
      status: 'حالة الطلب',
      deliveryTo: 'عنوان التوصيل',
      deliveryDestination: 'وجهة التوصيل والشحن',
      paymentType: 'طريقة الدفع',
      paymentSummary: 'ملخص الدفع وإجمالي الفاتورة',
      estimatedDelivery: 'المدة المتوقعة للتوصيل',
      summary: 'ملخص المشتريات',
      codDue: 'المبلغ المطلوب عند الاستلام',
      itemsOrdered: 'القطع المشمولة في الطلب',
      printReceipt: 'طباعة الفاتورة',
      timelineTitle: 'متابعة مسار التوصيل المباشر',
      needHelp: 'هل تحتاجين لمساعدة بخصوص طلبك؟',
      whatsappUs: 'تحدثي معنا مباشرة عبر واتساب',
      whatsappSupport: 'خدمة العملاء عبر واتساب',
      backToHome: 'العودة للصفحة الرئيسية',
    },
    wishlist: {
      title: 'قائمة رغباتي ومفضلاتي',
      subtitle: 'القطع الفاخرة التي حفظتها لتكون جزءاً من خزانتك المميزة.',
      emptyTitle: 'قائمة المفضلة فارغة حالياً',
      emptySubtitle: 'احفظي القطع التي تنال إعجابك بالضغط على أيقونة القلب على أي فستان أو طقم.',
      exploreBtn: 'استكشاف التشكيلات',
      moveToBag: 'نقل إلى حقيبة التسوق',
      remove: 'إزالة',
    },
    account: {
      title: 'حسابي ومتابعة الطلبات',
      subtitle: 'تابعي حالة مشترياتك السابقة وتفاصيل ملفك الشخصي.',
      profile: 'الملف الشخصي',
      orders: 'سجل الطلبات السابقة',
      noOrders: 'لا توجد طلبات مسجلة حتى الآن',
      noOrdersSubtitle: 'عند إتمام أي طلب جديد، ستظهر تفاصيله ومسار توصيله هنا مباشرة.',
      orderDate: 'تاريخ الطلب',
      totalAmount: 'الإجمالي',
      status: 'الحالة',
      viewDetails: 'عرض الفاتورة',
      installAppBanner: 'تطبيق أرميا للهاتف',
      installAppDesc: 'ثبتي تطبيقنا الخاص لتجربة تسوق أسرع وعروض حصرية فورية.',
      installBtn: 'تثبيت التطبيق',
      logout: 'تسجيل الخروج',
    },
    footer: {
      aboutText:
        'بوتيك أرميا مكرس لتقديم أزياء نسائية فاخرة ومصممة بأعلى معايير الأناقة والراحة. نختار أجود خامات الكتان والحرير لنمنحك تصاميم تبرز جمالك كل يوم.',
      collections: 'التشكيلات',
      customerCare: 'خدمة العملاء',
      contactUs: 'تواصلي معنا',
      contactText: 'فريق الاستقبال وخدمة العملاء متاح 7 أيام في الأسبوع للمساعدة وطلبات الجملة.',
      shippingPolicy: 'سياسة الشحن والتوصيل',
      returnPolicy: 'سياسة الاستبدال والاسترجاع (14 يوماً)',
      sizeGuide: 'دليل المقاسات',
      faq: 'الأسئلة الشائعة',
      rights: 'جميع الحقوق محفوظة.',
      madeInEgypt: 'صُمم وصُنع بفخر في مصر',
    },
    pwa: {
      appTitle: 'تطبيق أرميا بوتيك',
      appPill: 'تطبيق PWA',
      appDesc: 'ثبتي التطبيق لتسوق فوري وعروض VIP حصرية',
      getApp: 'تثبيت',
      officialApp: 'التطبيق الرسمي للهاتف المحمول',
      appSubtitle: 'استمتعي بتجربة تسوق راقية وفورية بدون انتظار مع ميزة الدفع عند الاستلام وحفظ الحقيبة بدون إنترنت.',
      featureSpeed: 'سرعة فائقة',
      featureSpeedDesc: 'تصفح فوري وحفظ مشترياتك بدون أي بطء.',
      featurePerks: 'مزايا VIP',
      featurePerksDesc: 'عروض وخصومات حصرية وتنبيهات بأحدث التشكيلات.',
      iosTitle: 'خطوات التثبيت على آيفون وآيباد (متصفح سفاري):',
      iosStep1: 'اضغطي على زر المشاركة (Share) أسفل المتصفح.',
      iosStep2: 'مرري لأسفل واختاري "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
      iosStep3: 'اضغطي على "إضافة" (Add) في الزاوية العلوية لاكتمال التثبيت.',
      installButton: 'تثبيت تطبيق أرميا على الشاشة الرئيسية',
      continueBrowser: 'المتابعة عبر المتصفح',
    },
  },
};
