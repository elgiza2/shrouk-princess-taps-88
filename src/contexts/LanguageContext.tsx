
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: { [key: string]: { [key: string]: string } } = {
  en: {
    mining: 'Mining',
    cards: 'Princess Cards',
    wallet: 'Wallet',
    tasks: 'Tasks',
    referral: 'Referral',
    admin: 'Admin',
    mineNow: 'Mine Now',
    tapsRemaining: 'Taps Remaining',
    hourlyEarnings: 'Hourly Earnings',
    totalEarned: 'Total Earned',
    upgrade: 'Upgrade',
    buyCard: 'Buy Card',
    connectWallet: 'Connect Wallet',
    dailyLogin: 'Daily Login',
    shareApp: 'Share App',
    inviteFriends: 'Invite Friends',
    addCard: 'Add New Card',
    cardName: 'Card Name',
    hourlyYield: 'Hourly Yield',
    price: 'Price',
    currency: 'Currency',
    description: 'Description',
    save: 'Save',
    cancel: 'Cancel',
    level: 'Level',
    owned: 'Owned',
    princess: 'Princess',
    magical: 'Magical',
    fairy: 'Fairy',
    queen: 'Queen',
    empress: 'Empress',
    // إضافة الترجمات المفقودة
    taskCenter: 'Tasks Center',
    dailyTasks: 'Daily Tasks',
    mainTasks: 'Main Tasks',
    partnerTasks: 'Partner Tasks',
    completed: 'Completed',
    claim: 'Claim',
    buyPrincessCard: 'Buy a Princess Card',
    completeAllTasks: 'Complete All Tasks',
    reachLevel10: 'Reach Level 10',
    invite5Friends: 'Invite 5 Friends',
    howToGetReferralLink: 'How to Get Referral Link',
    enterBot: 'Enter the Bot',
    writeCommand: 'Write Command',
    getReferralLink: 'Get Referral Link',
    openBot: 'Open Bot',
    airdropReward: 'Airdrop Reward',
    bonusReward: 'Bonus Reward',
    rarity: 'Rarity',
    addNewCard: 'Add New Card',
    manageCards: 'Manage Existing Cards'
  },
  ar: {
    mining: 'التعدين',
    cards: 'بطاقات الأميرات',
    wallet: 'المحفظة',
    tasks: 'المهام',
    referral: 'الإحالة',
    admin: 'الإدارة',
    mineNow: 'عدّن الآن',
    tapsRemaining: 'النقرات المتبقية',
    hourlyEarnings: 'الأرباح بالساعة',
    totalEarned: 'إجمالي المكسب',
    upgrade: 'ترقية',
    buyCard: 'شراء البطاقة',
    connectWallet: 'ربط المحفظة',
    dailyLogin: 'تسجيل دخول يومي',
    shareApp: 'مشاركة التطبيق',
    inviteFriends: 'دعوة الأصدقاء',
    addCard: 'إضافة بطاقة جديدة',
    cardName: 'اسم البطاقة',
    hourlyYield: 'العائد بالساعة',
    price: 'السعر',
    currency: 'العملة',
    description: 'الوصف',
    save: 'حفظ',
    cancel: 'إلغاء',
    level: 'المستوى',
    owned: 'مملوك',
    princess: 'أميرة',
    magical: 'سحرية',
    fairy: 'جنية',
    queen: 'ملكة',
    empress: 'إمبراطورة',
    // إضافة الترجمات المفقودة
    taskCenter: 'مركز المهام',
    dailyTasks: 'المهام اليومية',
    mainTasks: 'المهام الرئيسية',
    partnerTasks: 'مهام الشركاء',
    completed: 'مكتملة',
    claim: 'استلام',
    buyPrincessCard: 'شراء بطاقة أميرة',
    completeAllTasks: 'إكمال جميع المهام',
    reachLevel10: 'الوصول للمستوى 10',
    invite5Friends: 'دعوة 5 أصدقاء',
    howToGetReferralLink: 'كيفية الحصول على رابط الإحالة',
    enterBot: 'ادخل إلى البوت',
    writeCommand: 'اكتب الأمر',
    getReferralLink: 'احصل على رابط الإحالة',
    openBot: 'فتح البوت',
    airdropReward: 'مكافأة الإيردروب',
    bonusReward: 'مكافأة إضافية',
    rarity: 'الندرة',
    addNewCard: 'إضافة بطاقة جديدة',
    manageCards: 'إدارة البطاقات الموجودة'
  },
  ru: {
    mining: 'Майнинг',
    cards: 'Карты Принцесс',
    wallet: 'Кошелек',
    tasks: 'Задания',
    referral: 'Рефералы',
    admin: 'Админ',
    mineNow: 'Майнить',
    tapsRemaining: 'Тапов осталось',
    hourlyEarnings: 'Доход в час',
    totalEarned: 'Всего заработано',
    upgrade: 'Улучшить',
    buyCard: 'Купить карту',
    connectWallet: 'Подключить кошелек',
    dailyLogin: 'Ежедневный вход',
    shareApp: 'Поделиться',
    inviteFriends: 'Пригласить друзей',
    addCard: 'Добавить карту',
    cardName: 'Название карты',
    hourlyYield: 'Доход в час',
    price: 'Цена',
    currency: 'Валюта',
    description: 'Описание',
    save: 'Сохранить',
    cancel: 'Отмена',
    level: 'Уровень',
    owned: 'Принадлежит',
    princess: 'Принцесса',
    magical: 'Магическая',
    fairy: 'Фея',
    queen: 'Королева',
    empress: 'Императрица',
    // إضافة الترجمات المفقودة
    taskCenter: 'Центр заданий',
    dailyTasks: 'Ежедневные задания',
    mainTasks: 'Основные задания',
    partnerTasks: 'Партнерские задания',
    completed: 'Завершено',
    claim: 'Получить',
    buyPrincessCard: 'Купить карту принцессы',
    completeAllTasks: 'Выполнить все задания',
    reachLevel10: 'Достичь 10 уровня',
    invite5Friends: 'Пригласить 5 друзей',
    howToGetReferralLink: 'Как получить реферальную ссылку',
    enterBot: 'Войти в бота',
    writeCommand: 'Написать команду',
    getReferralLink: 'Получить реферальную ссылку',
    openBot: 'Открыть бота',
    airdropReward: 'Награда за аирдроп',
    bonusReward: 'Бонусная награда',
    rarity: 'Редкость',
    addNewCard: 'Добавить новую карту',
    manageCards: 'Управление существующими картами'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('ar'); // تغيير اللغة الافتراضية للعربية

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // Auto-detect language
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setLanguage(browserLang);
      } else {
        setLanguage('ar'); // الافتراضي العربية
      }
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.ar[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
