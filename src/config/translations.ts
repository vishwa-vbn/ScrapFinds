export type Language = 'en' | 'kn' | 'hi';

export interface Translations {
  // App Shell & Navigation
  skipToContent: string;
  mainNav: string;
  home: string;
  browse: string;
  seeAll: string;
  callUs: string;
  whatsappUs: string;
  backToAll: string;
  selectLanguage: string;

  // Home Page
  homeBadge: string;
  homeTitle: string;
  homeSubtitle: string;
  availableNow: string;
  availableSubtitle: string;
  howItWorks: string;
  howItWorksSubtitle: string;
  step1: string;
  step1Desc: string;
  step2: string;
  step2Desc: string;
  step3: string;
  step3Desc: string;
  sellToUsBadge: string;
  weCollectTitle: string;
  weCollectSubtitle: string;
  callToSell: string;
  contactUs: string;
  noItemsDesc: string;

  // Items / Catalog
  itemsTitle: string;
  itemsSubtitle: string;
  allCategories: string;
  search: string;
  loadMore: string;
  loading: string;
  noItemsHeading: string;
  noItemsFiltered: string;
  refresh: string;
  showingSaved: string;
  budgetExhausted: string;

  // Install
  installTitle: string;
  installSubtitle: string;
  installBtn: string;
  installSuccess: string;

  // Item Detail Page
  itemTypeLabel: string;
  conditionLabel: string;
  statusLabel: string;
  postedOn: string;
  descriptionLabel: string;
  noDescription: string;
  disclaimer: string;
  callToCollect: string;
  whatsapp: string;
  share: string;
  copied: string;

  // Conditions
  conditionLikeNew: string;
  conditionGood: string;
  conditionFair: string;
  conditionNeedsRepair: string;

  // Statuses
  statusAvailable: string;
  statusReserved: string;
  statusSold: string;

  // Categories
  catAudio: string;
  catPhones: string;
  catBicycles: string;
  catElectronics: string;
  catAppliances: string;
  catFurniture: string;
  catTools: string;
  catOther: string;

  // Scrap items
  scrapNewspaper: string;
  scrapCardboard: string;
  scrapIron: string;
  scrapCopper: string;
  scrapAluminium: string;
  scrapPlastic: string;
  scrapEwaste: string;

  // Footer & Contact
  directContact: string;
  footerNote: string;
  operatingHours: string;
  serviceAreasLabel: string;

  // Errors & Offline
  error: string;
  errorDesc: string;
  tryAgain: string;
  offline: string;
  offlineDesc: string;
  notFound: string;
  notFoundDesc: string;
  goHome: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    skipToContent: 'Skip to content',
    mainNav: 'Main navigation',
    home: 'Home',
    browse: 'Browse',
    seeAll: 'Browse all items',
    callUs: 'Call us',
    whatsappUs: 'WhatsApp us',
    backToAll: 'Back to all items',
    selectLanguage: 'Language',

    homeBadge: 'Recovered & Reusable Goods',
    homeTitle: 'Good items, direct to your hands',
    homeSubtitle: 'Browse good-condition recovered items. Call us to arrange a quick pickup.',
    availableNow: 'Available now',
    availableSubtitle: 'Inspected & verified, direct to your hands',
    howItWorks: 'How it works',
    howItWorksSubtitle: 'Simple 3-step pickup, direct to your hands',
    step1: '1. Browse items',
    step1Desc: 'See what is available today with real photos and details.',
    step2: '2. Call us',
    step2Desc: 'Tell us which item you want. We confirm it is available and hold it for you.',
    step3: '3. Collect',
    step3Desc: 'Come to our store and take it direct to your hands.',
    sellToUsBadge: 'Sell To Us',
    weCollectTitle: 'We also buy your scrap',
    weCollectSubtitle: 'We purchase domestic & commercial scrap materials with fair weighing:',
    callToSell: 'Call to sell scrap',
    contactUs: 'Contact us',
    noItemsDesc: 'We get new stock often. Check back soon or call us to ask.',

    itemsTitle: 'Available items',
    itemsSubtitle: 'Direct to your hands • Call to collect',
    allCategories: 'All Categories',
    search: 'Search items…',
    loadMore: 'Load more items',
    loading: 'Loading items…',
    noItemsHeading: 'No items right now',
    noItemsFiltered: 'No items found in this category.',
    refresh: 'Refresh',
    showingSaved: 'Showing saved list',
    budgetExhausted: 'Daily limit reached, showing saved list',

    installTitle: 'Install ScrapFinds App',
    installSubtitle: 'Add to your home screen for quick access to available items.',
    installBtn: 'Install App',
    installSuccess: 'App installed! Opening…',

    itemTypeLabel: 'Item Type (Category)',
    conditionLabel: 'Condition (Quality)',
    statusLabel: 'Availability Status',
    postedOn: 'Posted on',
    descriptionLabel: 'Item Description & Details',
    noDescription: 'No additional description provided.',
    disclaimer: 'Items are given as-is. Please inspect the item thoroughly when you collect it.',
    callToCollect: 'Call to collect',
    whatsapp: 'WhatsApp',
    share: 'Share',
    copied: 'Link copied!',

    conditionLikeNew: 'Like New (Barely used, clean & working)',
    conditionGood: 'Good Condition (Tested, fully functional)',
    conditionFair: 'Fair Condition (Signs of wear, functional)',
    conditionNeedsRepair: 'Needs Minor Repair (Servicing required)',

    statusAvailable: 'Available for Pickup',
    statusReserved: 'Reserved (Booked on Call)',
    statusSold: 'Collected / Sold',

    catAudio: 'Speakers & Audio',
    catPhones: 'Mobiles & Tablets',
    catBicycles: 'Bicycles & Cycles',
    catElectronics: 'Electronics & Gadgets',
    catAppliances: 'Home Appliances',
    catFurniture: 'Furniture & Decor',
    catTools: 'Tools & Hardware',
    catOther: 'Other General Items',

    scrapNewspaper: 'Old newspapers & books',
    scrapCardboard: 'Cardboard & cartons',
    scrapIron: 'Iron & steel',
    scrapCopper: 'Copper & brass',
    scrapAluminium: 'Aluminium',
    scrapPlastic: 'Plastic containers',
    scrapEwaste: 'E-waste (computers, electronics)',

    directContact: 'Direct Contact',
    footerNote: 'All items are given as-is, direct to your hands.',
    operatingHours: 'Business Hours',
    serviceAreasLabel: 'Service Areas',

    error: 'Something went wrong',
    errorDesc: 'We could not load this. Please try again.',
    tryAgain: 'Try again',
    offline: 'You are offline',
    offlineDesc: 'Showing saved data. Some features may be limited.',
    notFound: 'Page not found',
    notFoundDesc: 'The page you are looking for does not exist.',
    goHome: 'Go home',
  },

  kn: {
    skipToContent: 'ವಿಷಯಕ್ಕೆ ಹೋಗಿ',
    mainNav: 'ಮುಖ್ಯ ನ್ಯಾವಿಗೇಷನ್',
    home: 'ಮುಖಪುಟ',
    browse: 'ಹುಡುಕಿ',
    seeAll: 'ಎಲ್ಲಾ ವಸ್ತುಗಳನ್ನು ನೋಡಿ',
    callUs: 'ನಮಗೆ ಕರೆ ಮಾಡಿ',
    whatsappUs: 'ವಾಟ್ಸಾಪ್ ಮಾಡಿ',
    backToAll: 'ಎಲ್ಲಾ ವಸ್ತುಗಳಿಗೆ ಹಿಂತಿರುಗಿ',
    selectLanguage: 'ಭಾಷೆ',

    homeBadge: 'ಉತ್ತಮ ಮರುಬಳಕೆ ವಸ್ತುಗಳು',
    homeTitle: 'ಉತ್ತಮ ಸ್ಥಿತಿಯ ವಸ್ತುಗಳು, ನೇರ ನಿಮ್ಮ ಕೈಗೆ',
    homeSubtitle: 'ಉತ್ತಮ ಸ್ಥಿತಿಯಲ್ಲಿರುವ ಮರುಬಳಕೆಯ ವಸ್ತುಗಳನ್ನು ನೋಡಿ. ಪಡೆಯಲು ನಮಗೆ ಕರೆ ಮಾಡಿ.',
    availableNow: 'ಈಗ ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳು',
    availableSubtitle: 'ಪರಿಶೀಲಿಸಲಾದ ವಸ್ತುಗಳು, ನೇರ ನಿಮ್ಮ ಕೈಗೆ',
    howItWorks: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
    howItWorksSubtitle: 'ನೇರ ನಿಮ್ಮ ಕೈಗೆ ಪಡೆಯಲು ಸರಳ 3 ಹಂತಗಳು',
    step1: '1. ವಸ್ತುಗಳನ್ನು ನೋಡಿ',
    step1Desc: 'ನೈಜ ಫೋಟೋಗಳು ಮತ್ತು ವಿವರಗಳೊಂದಿಗೆ ಇಂದು ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    step2: '2. ನಮಗೆ ಕರೆ ಮಾಡಿ',
    step2Desc: 'ಯಾವ ವಸ್ತು ಬೇಕು ಎಂದು ತಿಳಿಸಿ. ನಾವು ಲಭ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸಿ ನಿಮಗಾಗಿ ಕಾಯ್ದಿರಿಸುತ್ತೇವೆ.',
    step3: '3. ನೇರವಾಗಿ ಪಡೆದುಕೊಳ್ಳಿ',
    step3Desc: 'ನಮ್ಮ ಬಳಿಗೆ ಬಂದು ವಸ್ತುವನ್ನು ಪರಿಶೀಲಿಸಿ ನೇರ ನಿಮ್ಮ ಕೈಗೆ ಪಡೆದುಕೊಳ್ಳಿ.',
    sellToUsBadge: 'ನಮಗೆ ಮಾರಾಟ ಮಾಡಿ',
    weCollectTitle: 'ನಾವು ಹಳೆಯ ಗುಜರಿ / ಸ್ಕ್ರ್ಯಾಪ್ ಕೂಡ ಖರೀದಿಸುತ್ತೇವೆ',
    weCollectSubtitle: 'ನಿಖರವಾದ ತೂಕ ಮತ್ತು ನ್ಯಾಯಯುತ ದರದಲ್ಲಿ ಗೃಹೋಪಯೋಗಿ ಮತ್ತು ಅಂಗಡಿ ಸ್ಕ್ರ್ಯಾಪ್ ಖರೀದಿಸುತ್ತೇವೆ:',
    callToSell: 'ಗುಜರಿ ಮಾರಾಟಕ್ಕೆ ಕರೆ ಮಾಡಿ',
    contactUs: 'ಸಂಪರ್ಕಿಸಿ',
    noItemsDesc: 'ಹೊಸ ವಸ್ತುಗಳು ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತವೆ. ದಯವಿಟ್ಟು ನಂತರ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಕರೆ ಮಾಡಿ.',

    itemsTitle: 'ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳು',
    itemsSubtitle: 'ನೇರ ನಿಮ್ಮ ಕೈಗೆ • ಪಡೆಯಲು ಕರೆ ಮಾಡಿ',
    allCategories: 'ಎಲ್ಲಾ ವಿಭಾಗಗಳು',
    search: 'ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ…',
    loadMore: 'ಇನ್ನಷ್ಟು ವಸ್ತುಗಳನ್ನು ತೋರಿಸಿ',
    loading: 'ವಸ್ತುಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ…',
    noItemsHeading: 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲ',
    noItemsFiltered: 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲ.',
    refresh: 'ಮರುಲೋಡ್ ಮಾಡಿ',
    showingSaved: 'ಉಳಿಸಿದ ಪಟ್ಟಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ',
    budgetExhausted: 'ದೈನಂದಿನ ಮಿತಿ ತಲುಪಿದೆ, ಉಳಿಸಿದ ಪಟ್ಟಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ',

    installTitle: 'ScrapFinds ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ',
    installSubtitle: 'ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳನ್ನು ತ್ವರಿತವಾಗಿ ವೀಕ್ಷಿಸಲು ಮೊಬೈಲ್ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ.',
    installBtn: 'ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ',
    installSuccess: 'ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಆಗಿದೆ! ತೆರೆಯಲಾಗುತ್ತಿದೆ…',

    itemTypeLabel: 'ವಸ್ತುವಿನ ಪ್ರಕಾರ (ವರ್ಗ)',
    conditionLabel: 'ವಸ್ತುವಿನ ಸ್ಥಿತಿ (ಗುಣಮಟ್ಟ)',
    statusLabel: 'ಲಭ್ಯತೆಯ ಸ್ಥಿತಿ',
    postedOn: 'ಪೋಸ್ಟ್ ಮಾಡಿದ ದಿನಾಂಕ',
    descriptionLabel: 'ವಸ್ತುವಿನ ಪೂರ್ಣ ವಿವರಣೆ',
    noDescription: 'ಯಾವುದೇ ಹೆಚ್ಚಿನ ವಿವರಣೆ ನೀಡಲಾಗಿಲ್ಲ.',
    disclaimer: 'ವಸ್ತುಗಳು ಇದ್ದ ಸ್ಥಿತಿಯಲ್ಲೇ ನೀಡಲಾಗುತ್ತದೆ. ಸಂಗ್ರಹಿಸುವಾಗ ವಸ್ತುವನ್ನು ಖುದ್ದಾಗಿ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ.',
    callToCollect: 'ಪಡೆಯಲು ಕರೆ ಮಾಡಿ',
    whatsapp: 'ವಾಟ್ಸಾಪ್',
    share: 'ಹಂಚಿಕೊಳ್ಳಿ',
    copied: 'ಲಿಂಕ್ ಕಾಪಿ ಆಗಿದೆ!',

    conditionLikeNew: 'ಹೊಸದರಂತೆ ಇದೆ (ಅತ್ಯುತ್ತಮ ಸ್ಥಿತಿ, ಸ್ವಚ್ಛವಾಗಿದೆ)',
    conditionGood: 'ಉತ್ತಮ ಸ್ಥಿತಿ (ಪರೀಕ್ಷಿಸಲಾಗಿದೆ, ಚೆನ್ನಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ)',
    conditionFair: 'ಸಾಧಾರಣ ಸ್ಥಿತಿ (ಸ್ವಲ್ಪ ಬಳಕೆಯಾಗಿದೆ, ಕೆಲಸ ಮಾಡುತ್ತದೆ)',
    conditionNeedsRepair: 'ದುರಸ್ತಿ ಅಗತ್ಯವಿದೆ (ಸರ್ವಿಸಿಂಗ್ ಬೇಕಾಗಬಹುದು)',

    statusAvailable: 'ಪಡೆಯಲು ಲಭ್ಯವಿದೆ',
    statusReserved: 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ (ಬುಕ್ ಆಗಿದೆ)',
    statusSold: 'ಕೊಡಲಾಗಿದೆ / ಮಾರಾಟವಾಗಿದೆ',

    catAudio: 'ಸ್ಪೀಕರ್‌ಗಳು ಮತ್ತು ಆಡಿಯೋ',
    catPhones: 'ಮೊಬೈಲ್ ಮತ್ತು ಟ್ಯಾಬ್ಲೆಟ್‌ಗಳು',
    catBicycles: 'ಸೈಕಲ್‌ಗಳು',
    catElectronics: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಉಪಕರಣಗಳು',
    catAppliances: 'ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳು',
    catFurniture: 'ಪೀಠೋಪಕರಣಗಳು (ಫರ್ನಿಚರ್)',
    catTools: 'ಟೂಲ್ಸ್ ಮತ್ತು ಉಪಕರಣಗಳು',
    catOther: 'ಇತರ ಸಾಮಾನ್ಯ ವಸ್ತುಗಳು',

    scrapNewspaper: 'ಹಳೆಯ ಪತ್ರಿಕೆಗಳು ಮತ್ತು ಪುಸ್ತಕಗಳು',
    scrapCardboard: 'ರಟ್ಟು ಮತ್ತು ಪ್ಯಾಕಿಂಗ್ ಬಾಕ್ಸ್‌ಗಳು',
    scrapIron: 'ಕಬ್ಬಿಣ ಮತ್ತು ಸ್ಟೀಲ್',
    scrapCopper: 'ತಾಮ್ರ ಮತ್ತು ಹಿತ್ತಾಳೆ',
    scrapAluminium: 'ಅಲ್ಯೂಮಿನಿಯಂ',
    scrapPlastic: 'ಪ್ಲಾಸ್ಟಿಕ್ ವಸ್ತುಗಳು',
    scrapEwaste: 'ಇ-ತ್ಯಾಜ್ಯ (ಕಂಪ್ಯೂಟರ್, ಮೊಬೈಲ್)',

    directContact: 'ನೇರ ಸಂಪರ್ಕ',
    footerNote: 'ಎಲ್ಲಾ ವಸ್ತುಗಳು ನೇರ ನಿಮ್ಮ ಕೈಗೆ ನೀಡಲು ಇದ್ದ ಸ್ಥಿತಿಯಲ್ಲೇ ಇರುತ್ತವೆ.',
    operatingHours: 'ಕಾರ್ಯನಿರ್ವಹಣೆಯ ಸಮಯ',
    serviceAreasLabel: 'ಸೇವಾ ಪ್ರದೇಶಗಳು',

    error: 'ದೋಷ ಸಂಭವಿಸಿದೆ',
    errorDesc: 'ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    offline: 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ',
    offlineDesc: 'ಉಳಿಸಿದ ಮಾಹಿತಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    notFound: 'ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ',
    notFoundDesc: 'ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪುಟ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ.',
    goHome: 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ',
  },

  hi: {
    skipToContent: 'सामग्री पर जाएं',
    mainNav: 'मुख्य नेविगेशन',
    home: 'होम',
    browse: 'ब्राउज़',
    seeAll: 'सभी सामान देखें',
    callUs: 'हमें कॉल करें',
    whatsappUs: 'व्हाट्सएप करें',
    backToAll: 'वापस सभी सामान पर जाएं',
    selectLanguage: 'भाषा',

    homeBadge: 'उपयोगी व रीसायकल किया हुआ सामान',
    homeTitle: 'अच्छी स्थिति का सामान, सीधा आपके हाथों में',
    homeSubtitle: 'अच्छी स्थिति के पुराने व रीसायकल सामान देखें। सामान लेने के लिए सीधे कॉल करें.',
    availableNow: 'अभी उपलब्ध सामान',
    availableSubtitle: 'जाँचा और परखा हुआ, सीधा आपके हाथों में',
    howItWorks: 'यह कैसे काम करता है?',
    howItWorksSubtitle: 'सीधा आपके हाथों में सामान पाने के 3 आसान कदम',
    step1: '1. सामान देखें',
    step1Desc: 'असली फ़ोटो और विवरण के साथ देखें कि आज क्या उपलब्ध है।',
    step2: '2. हमें कॉल करें',
    step2Desc: 'बताएं कि आपको कौन सा सामान चाहिए। हम उपलब्धता की पुष्टि करके आपके लिए रख लेंगे।',
    step3: '3. सीधा ले जाएं',
    step3Desc: 'हमारे पास आकर सामान की जांच करें और सीधा अपने हाथों में लें।',
    sellToUsBadge: 'हमें बेचें',
    weCollectTitle: 'हम पुराना कबाड़ और स्क्रैप भी खरीदते हैं',
    weCollectSubtitle: 'सही वज़न और उचित दाम पर घरेलू व व्यावसायिक कबाड़ खरीदते हैं:',
    callToSell: 'कबाड़ बेचने के लिए कॉल करें',
    contactUs: 'संपर्क करें',
    noItemsDesc: 'नया सामान आता रहता है। कृपया दोबारा देखें या फोन करके पूछें।',

    itemsTitle: 'उपलब्ध सामान',
    itemsSubtitle: 'सीधा आपके हाथों में • लेने के लिए कॉल करें',
    allCategories: 'सभी श्रेणियां',
    search: 'सामान खोजें…',
    loadMore: 'और सामान देखें',
    loading: 'सामान लोड हो रहा है…',
    noItemsHeading: 'फ़िलहाल कोई सामान उपलब्ध नहीं है',
    noItemsFiltered: 'इस श्रेणी में कोई सामान नहीं मिला।',
    refresh: 'रिफ्रेश करें',
    showingSaved: 'सहेजी गई सूची दिखाई जा रही है',
    budgetExhausted: 'दैनिक सीमा पूरी हुई, सहेजी गई सूची दिखाई जा रही है',

    installTitle: 'ScrapFinds ऐप इंस्टॉल करें',
    installSubtitle: 'सामान को तुरंत देखने के लिए अपने फोन की होम स्क्रीन पर जोड़ें।',
    installBtn: 'ऐप इंस्टॉल करें',
    installSuccess: 'ऐप इंस्टॉल हो गया! खुल रहा है…',

    itemTypeLabel: 'सामान का प्रकार (श्रेणी)',
    conditionLabel: 'सामान की हालत (स्थिति)',
    statusLabel: 'उपलब्धता की स्थिति',
    postedOn: 'पोस्ट करने की तारीख',
    descriptionLabel: 'सामान का पूरा विवरण',
    noDescription: 'कोई अतिरिक्त विवरण उपलब्ध नहीं है।',
    disclaimer: 'सामान जैसी स्थिति में है, वैसा ही दिया जाता है। लेते समय कृपया खुद अच्छी तरह जांच लें।',
    callToCollect: 'लेने के लिए कॉल करें',
    whatsapp: 'व्हाट्सएप',
    share: 'शेयर करें',
    copied: 'लिंक कॉपी हो गया!',

    conditionLikeNew: 'बिल्कुल नया जैसा (साफ़-सुथरा, चालू हालत)',
    conditionGood: 'अच्छी स्थिति (जाँचा हुआ, पूरी तरह चालू)',
    conditionFair: 'सामान्य स्थिति (उपयोग के निशान, चालू हालत)',
    conditionNeedsRepair: 'मरम्मत की आवश्यकता (सर्विसिंग चाहिए)',

    statusAvailable: 'लेने के लिए उपलब्ध है',
    statusReserved: 'आरक्षित (कॉल पर बुक किया गया)',
    statusSold: 'ले लिया गया / बिक गया',

    catAudio: 'स्पीकर और ऑडियो',
    catPhones: 'मोबाइल और टैबलेट',
    catBicycles: 'साइकिल',
    catElectronics: 'इलेक्ट्रॉनिक्स उपकरण',
    catAppliances: 'घरेलू उपकरण (मिक्सर, पंखे आदि)',
    catFurniture: 'फ़र्नीचर',
    catTools: 'टूल्स और औज़ार',
    catOther: 'अन्य विविध सामान',

    scrapNewspaper: 'पुराने अख़बार और किताबें',
    scrapCardboard: 'गत्ता और कार्टन',
    scrapIron: 'लोहा और स्टील',
    scrapCopper: 'तांबा और पीतल',
    scrapAluminium: 'एल्युमिनियम',
    scrapPlastic: 'प्लास्टिक की वस्तुएं',
    scrapEwaste: 'ई-कचरा (कंप्यूटर, पुराने फोन)',

    directContact: 'सीधा संपर्क',
    footerNote: 'सभी सामान जैसी स्थिति में हैं वैसे ही, सीधा आपके हाथों में उपलब्ध हैं।',
    operatingHours: 'कामकाज का समय',
    serviceAreasLabel: 'सेवा क्षेत्र',

    error: 'कुछ गड़बड़ हुई',
    errorDesc: 'जानकारी लोड नहीं हो सकी। कृपया दोबारा प्रयास करें।',
    tryAgain: 'पुनः प्रयास करें',
    offline: 'आप ऑफ़लाइन हैं',
    offlineDesc: 'सहेजा गया डेटा दिखाया जा रहा है।',
    notFound: 'पेज नहीं मिला',
    notFoundDesc: 'आप जो पेज ढूंढ रहे हैं वह मौजूद नहीं है।',
    goHome: 'होमपेज पर जाएं',
  },
};
