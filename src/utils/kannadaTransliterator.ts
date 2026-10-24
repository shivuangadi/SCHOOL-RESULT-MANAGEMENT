/**
 * Karnataka School Result Software - High-Fidelity English-to-Kannada Name Transliterator
 *
 * Designed specifically for Karnataka School Student & Parent Names, Surnames, Titles and Communities.
 * 
 * Rules:
 * 1. Numbers across the application need to be in Arabic/English only (0-9). Never use Kannada numerals.
 * 2. Original English spelling is fixed and preserved so switching back to English has zero distortion.
 * 3. The translated names are updated in student database and used across all forms, registers and reports.
 */

import { Student } from '../types';

// Check if string contains Kannada script characters (U+0C80 - U+0CFF)
export const containsKannada = (str: string): boolean => {
  if (!str) return false;
  return /[\u0C80-\u0CFF]/.test(str);
};

// Check if text is mostly Kannada
export const isKannadaText = (str: string): boolean => {
  if (!str) return false;
  const kannadaChars = (str.match(/[\u0C80-\u0CFF]/g) || []).length;
  const latinChars = (str.match(/[a-zA-Z]/g) || []).length;
  return kannadaChars > latinChars;
};

/**
 * Common Karnataka first names, middle names, last names, surnames and titles dictionary.
 * Normalized to lowercase for fast O(1) lookup.
 */
const KANNADA_NAME_DICTIONARY: Record<string, string> = {
  // Boys Names
    aarav: 'ಆರವ',
    aakash: 'ಆಕಾಶ',
    akash: 'ಆಕಾಶ',
    abhishek: 'ಅಭಿಷೇಕ',
    abhishekha: 'ಅಭಿಷೇಕ',
    abhinav: 'ಅಭಿನವ',
    adarsh: 'ಆದರ್ಶ',
    adarsha: 'ಆದರ್ಶ',
    aditya: 'ಆದಿತ್ಯ',
    aftab: 'ಅಫ್ತಾಬ',
    ajay: 'ಅಜಯ',
    ajit: 'ಅಜಿತ',
    ajith: 'ಅಜಿತ',
    akshay: 'ಅಕ್ಷಯ',
    altaf: 'ಅಲ್ತಾಫ',
    amar: 'ಅಮರ',
    amaregouda: 'ಅಮರೇಗೌಡ',
    amresh: 'ಅಮರೇಶ',
    amit: 'ಅಮಿತ',
    amrut: 'ಅಮೃತ',
    anand: 'ಆನಂದ',
    ananda: 'ಆನಂದ',
    anil: 'ಅನಿಲ',
    anilpatil: 'ಅನಿಲ್ ಪಾಟೀಲ',
    arbaaz: 'ಅರ್ಬಾಜ',
    arif: 'ಆರಿಫ',
    arun: 'ಅರುಣ',
    arunkumar: 'ಅರುಣ್‌ಕುಮಾರ',
    ashok: 'ಅಶೋಕ',
    ashoka: 'ಅಶೋಕ',
    ashwin: 'ಅಶ್ವಿನ',
    asif: 'ಆಸಿಫ',
    avinash: 'ಅವಿನಾಶ',
    ayyanagouda: 'ಅಯ್ಯನಗೌಡ',
    basavaraj: 'ಬಸವರಾಜ',
    basavaraja: 'ಬಸವರಾಜ',
    basappa: 'ಬಸಪ್ಪ',
    basavanna: 'ಬಸವಣ್ಣ',
    basavesh: 'ಬಸವೇಶ',
    beerappa: 'ಬೀರಪ್ಪ',
    bhagavant: 'ಭಾಗವಂತ',
    bhagavantha: 'ಭಾಗವಂತ',
    bharat: 'ಭರತ',
    bharath: 'ಭರತ',
    bhaskar: 'ಭಾಸ್ಕರ',
    bheemappa: 'ಭೀಮಪ್ಪ',
    bhimappa: 'ಭೀಮಪ್ಪ',
    bhimsen: 'ಭೀಮಸೇನ',
    bhupal: 'ಭೂಪಾಲ',
    biradar: 'ಬಿರಾದಾರ',
    chandru: 'ಚಂದ್ರು',
    chandra: 'ಚಂದ್ರ',
    chandrakant: 'ಚಂದ್ರಕಾಂತ',
    chandrashekhar: 'ಚಂದ್ರಶೇಖರ',
    channappa: 'ಚನ್ನಪ್ಪ',
    channabasappa: 'ಚನ್ನಬಸಪ್ಪ',
    chetan: 'ಚೇತನ',
    chethan: 'ಚೇತನ',
    danappa: 'ದಾನಪ್ಪ',
    darshan: 'ದರ್ಶನ',
    dayanand: 'ದಯಾನಂದ',
    deepak: 'ದೀಪಕ',
    devanand: 'ದೇವಾನಂದ',
    devendra: 'ದೇವಂದ್ರ',
    devappa: 'ದೇವಪ್ಪ',
    dilip: 'ದಿಲೀಪ',
    dinesh: 'ದಿನೇಶ',
    dyamappa: 'ದ್ಯಾಮಪ್ಪ',
    eashwar: 'ಈಶ್ವರ',
    eeshwar: 'ಈಶ್ವರ',
    fakirappa: 'ಫಕೀರಪ್ಪ',
    farhan: 'ಫರ್ಹಾನ',
    gajanan: 'ಗಜಾನನ',
    ganesh: 'ಗಣೇಶ',
    ganesha: 'ಗಣೇಶ',
    gangadhar: 'ಗಂಗಾಧರ',
    gangappa: 'ಗಂಗಪ್ಪ',
    girish: 'ಗಿರೀಶ',
    gopal: 'ಗೋಪಾಲ',
    gopalakrishna: 'ಗೋಪಾಲಕೃಷ್ಣ',
    govind: 'ಗೋವಿಂದ',
    guru: 'ಗುರು',
    gururaj: 'ಗುರುರಾಜ',
    gururaja: 'ಗುರುರಾಜ',
    gurudas: 'ಗುರುದಾಸ',
    hanamant: 'ಹನಮಂತ',
    hanamappa: 'ಹನಮಪ್ಪ',
    hanumanth: 'ಹನುಮಂತ',
    hanumappa: 'ಹನುಮಪ್ಪ',
    harish: 'ಹರೀಶ',
    harsha: 'ಹರ್ಷ',
    imran: 'ಇಮ್ರಾನ',
    iqbal: 'ಇಕ್ಬಾಲ',
    irappa: 'ಈರಪ್ಪ',
    ishwar: 'ಈಶ್ವರ',
    jagadish: 'ಜಗದೀಶ',
    jagadeesh: 'ಜಗದೀಶ',
    jayanth: 'ಜಯಂತ',
    kallappa: 'ಕಲ್ಲಪ್ಪ',
    kalyan: 'ಕಲ್ಯಾಣ',
    kalyankumar: 'ಕಲ್ಯಾಣ್‌ಕುಮಾರ',
    kantesh: 'ಕಾಂತೇಶ',
    karthik: 'ಕಾರ್ತಿಕ',
    kartik: 'ಕಾರ್ತಿಕ',
    kenchappa: 'ಕೆಂಚಪ್ಪ',
    kiran: 'ಕಿರಣ',
    kirankumar: 'ಕಿರಣ್‌ಕುಮಾರ',
    krishna: 'ಕೃಷ್ಣ',
    kumar: 'ಕುಮಾರ',
    lakshman: 'ಲಕ್ಷ್ಮಣ',
    laxman: 'ಲಕ್ಷ್ಮಣ',
    lingappa: 'ಲಿಂಗಪ್ಪ',
    lingaraj: 'ಲಿಂಗರಾಜ',
    lokesh: 'ಲೋಕೇಶ',
    madhav: 'ಮಾಧವ',
    madhu: 'ಮಧು',
    mahadhev: 'ಮಹಾದೇವ',
    mahadev: 'ಮಹಾದೇವ',
    mahanth: 'ಮಹಾಂತ',
    mahesh: 'ಮಹೇಶ',
    mahaboob: 'ಮಹಬೂಬ',
    malatesh: 'ಮಾಲತೇಶ',
    mallikarjun: 'ಮಲ್ಲಿಕಾರ್ಜುನ',
    mallappa: 'ಮಲ್ಲಪ್ಪ',
    mallanna: 'ಮಲ್ಲಣ್ಣ',
    manoj: 'ಮನೋಜ',
    manjunath: 'ಮಂಜುನಾಥ',
    manjunatha: 'ಮಂಜುನಾಥ',
    manju: 'ಮಂಜು',
    maruti: 'ಮಾರುತಿ',
    mohammed: 'ಮೊಹಮ್ಮದ',
    mohammad: 'ಮೊಹಮ್ಮದ',
    mohan: 'ಮೋಹನ',
    mounesh: 'ಮೌನೇಶ',
    mukesh: 'ಮುಕೇಶ',
    nagaraj: 'ನಾಗರಾಜ',
    nagaraja: 'ನಾಗರಾಜ',
    nagesh: 'ನಾಗೇಶ',
    nandish: 'ನಂದೀಶ',
    narayan: 'ನಾರಾಯಣ',
    narayana: 'ನಾರಾಯಣ',
    narayanappa: 'ನಾರಾಯಣಪ್ಪ',
    narayanaswamy: 'ನಾರಾಯಣಸ್ವಾಮಿ',
    narayanamma: 'ನಾರಾಯಣಮ್ಮ',
    narayanarao: 'ನಾರಾಯಣರಾವ್',
    nasir: 'ನಾಸಿರ',
    naveen: 'ನವೀನ',
    naveenkumar: 'ನವೀನ್‌ಕುಮಾರ',
    nikhil: 'ನಿಖಿಲ',
    ningappa: 'ನಿಂಗಪ್ಪ',
    nithin: 'ನಿತಿನ',
    nitin: 'ನಿತಿನ',
    omkar: 'ಓಂಕಾರ',
    pankaj: 'ಪಂಕಜ',
    parashuram: 'ಪರಶುರಾಮ',
    parashurama: 'ಪರಶುರಾಮ',
    pavan: 'ಪವನ',
    pavankumar: 'ಪವನ್‌ಕುಮಾರ',
    pradeep: 'ಪ್ರದೀಪ',
    prajwal: 'ಪ್ರಜ್ವಲ',
    prakash: 'ಪ್ರಕಾಶ',
    pramod: 'ಪ್ರಮೋದ',
    prasad: 'ಪ್ರಸಾದ',
    prasanna: 'ಪ್ರಸನ್ನ',
    prashant: 'ಪ್ರಶಾಂತ',
    prashanth: 'ಪ್ರಶಾಂತ',
    praveen: 'ಪ್ರವೀಣ',
    praveenkumar: 'ಪ್ರವೀಣ್‌ಕುಮಾರ',
    prithvi: 'ಪೃಥ್ವಿ',
    prithviraj: 'ಪೃಥ್ವಿರಾಜ',
    raghav: 'ರಾಘವ',
    raghavendra: 'ರಾಘವೇಂದ್ರ',
    raghu: 'ರಘು',
    rahul: 'ರಾಹುಲ',
    rahula: 'ರಾಹುಲ',
    raj: 'ರಾಜ',
    raja: 'ರಾಜ',
    rajashekhar: 'ರಾಜಶೇಖರ',
    rajat: 'ರಜತ',
    rajendra: 'ರಾಜೇಂದ್ರ',
    rajesh: 'ರಾಜೇಶ',
    raju: 'ರಾಜು',
    rakesh: 'ರಾಕೇಶ',
    ram: 'ರಾಮ',
    rama: 'ರಾಮ',
    ramappa: 'ರಾಮಪ್ಪ',
    ramesh: 'ರಮೇಶ',
    rameshpatil: 'ರಮೇಶ್ ಪಾಟೀಲ',
    ramu: 'ರಾಮು',
    ranjit: 'ರಂಜಿತ',
    ravi: 'ರವಿ',
    ravindra: 'ರವೀಂದ್ರ',
    ravikumar: 'ರವಿಕುಮಾರ',
    rizwan: 'ರಿಜ್ವಾನ',
    rohit: 'ರೋಹಿತ',
    rohith: 'ರೋಹಿತ',
    roshan: 'ರೋಷನ',
    sachin: 'ಸಚಿನ',
    sachina: 'ಸಚಿನ',
    sagar: 'ಸಾಗರ',
    sahil: 'ಸಾಹಿಲ',
    salman: 'ಸಲ್ಮಾನ',
    sameer: 'ಸಮೀರ',
    sandeep: 'ಸಂದೀಪ',
    sangamesh: 'ಸಂಗಮೇಶ',
    sangappa: 'ಸಂಗಪ್ಪ',
    sanjay: 'ಸಂಜಯ',
    santosh: 'ಸಂತೋಷ',
    santhosh: 'ಸಂತೋಷ',
    satish: 'ಸತೀಶ',
    satheesh: 'ಸತೀಶ',
    shankar: 'ಶಂಕರ',
    shankara: 'ಶಂಕರ',
    shankargouda: 'ಶಂಕರಗೌಡ',
    shantappa: 'ಶಾಂತಪ್ಪ',
    sharan: 'ಶರಣ',
    sharanappa: 'ಶರಣಪ್ಪ',
    shashank: 'ಶಶಾಂಕ',
    shashi: 'ಶಶಿ',
    shashidhar: 'ಶಶಿಧರ',
    shivanand: 'ಶಿವಾನಂದ',
    shivananda: 'ಶಿವಾನಂದ',
    shivappa: 'ಶಿವಪ್ಪ',
    shivakumar: 'ಶಿವಕುಮಾರ',
    shivaprasad: 'ಶಿವಪ್ರಸಾದ',
    shivashankar: 'ಶಿವಶಂಕರ',
    shreesha: 'ಶ್ರೀಶ',
    shridhar: 'ಶ್ರೀಧರ',
    siddappa: 'ಸಿದ್ಧಪ್ಪ',
    siddarama: 'ಸಿದ್ಧರಾಮ',
    siddesh: 'ಸಿದ್ದೇಶ',
    singh: 'ಸಿಂಗ್',
    somappa: 'ಸೋಮಪ್ಪ',
    somaling: 'ಸೋಮಲಿಂಗ',
    somanath: 'ಸೋಮನಾಥ',
    somashekhar: 'ಸೋಮಶೇಖರ',
    sooraj: 'ಸೂರಜ',
    sourav: 'ಸೌರವ',
    srinivas: 'ಶ್ರೀನಿವಾಸ',
    srinivasa: 'ಶ್ರೀನಿವಾಸ',
    subhash: 'ಸುಭಾಷ',
    sudhakar: 'ಸುಧಾಕರ',
    sudhir: 'ಸುಧೀರ',
    suhas: 'ಸುಹಾಸ',
    sujeet: 'ಸುಜೀತ',
    sumanth: 'ಸುಮಂತ',
    sundar: 'ಸುಂದರ',
    sunil: 'ಸುನಿಲ',
    sunilkumar: 'ಸುನಿಲ್‌ಕುಮಾರ',
    suraj: 'ಸೂರಜ',
    suresh: 'ಸುರೇಶ',
    suresha: 'ಸುರೇಶ',
    tahashildar: 'ತಹಶೀಲ್ದಾರ',
    tarun: 'ತರುಣ',
    tejas: 'ತೇಜಸ',
    thippeswamy: 'ತಿಪ್ಪೇಸ್ವಾಮಿ',
    timmanna: 'ತಿಮ್ಮಣ್ಣ',
    tukaram: 'ತುಕಾರಾಂ',
    uday: 'ಉದಯ',
    udayakumar: 'ಉದಯಕುಮಾರ',
    umesh: 'ಉಮೇಶ',
    usman: 'ಉಸ್ಮಾನ',
    vaibhav: 'ವೈಭವ',
    varun: 'ವರುಣ',
    vasant: 'ವಸಂತ',
    vasanth: 'ವಸಂತ',
    veeranna: 'ವೀರಣ್ಣ',
    veerendra: 'ವೀರೇಂದ್ರ',
    venkatesh: 'ವೆಂಕಟೇಶ',
    venkanna: 'ವೆಂಕಣ್ಣ',
    vidyadhar: 'ವಿದ್ಯಾಧರ',
    vijay: 'ವಿಜಯ',
    vijayakumar: 'ವಿಜಯಕುಮಾರ',
    vikas: 'ವಿಕಾಸ',
    vinay: 'ವಿನಯ',
    vinayak: 'ವಿನಾಯಕ',
    vinayaka: 'ವಿನಾಯಕ',
    vinod: 'ವಿನೋದ',
    vinodkumar: 'ವಿನೋದ್‌ಕುಮಾರ',
    vishal: 'ವಿಶಾಲ',
    vishnu: 'ವಿಷ್ಣು',
    vishwanath: 'ವಿಶ್ವನಾಥ',
    yallappa: 'ಯಲ್ಲಪ್ಪ',
    yash: 'ಯಶ',
    yashwant: 'ಯಶವಂತ',
    yashwanth: 'ಯಶವಂತ',
    yogesh: 'ಯೋಗೇಶ',
    zaid: 'ಜೈದ್',

  // Girls Names
    aishwarya: 'ಐಶ್ವರ್ಯಾ',
    akshata: 'ಅಕ್ಷತಾ',
    akshatha: 'ಅಕ್ಷತಾ',
    ananya: 'ಅನನ್ಯಾ',
    anita: 'ಅನಿತಾ',
    anitha: 'ಅನಿತಾ',
    anjali: 'ಅಂಜಲಿ',
    ankita: 'ಅಂಕಿತಾ',
    annapurna: 'ಅನ್ನಪೂರ್ಣಾ',
    anupama: 'ಅನುಪಮಾ',
    archana: 'ಅರ್ಚನಾ',
    arpita: 'ಅರ್ಪಿತಾ',
    arpitha: 'ಅರ್ಪಿತಾ',
    aruna: 'ಅರುಣಾ',
    asha: 'ಆಶಾ',
    ashwini: 'ಅಶ್ವಿನಿ',
    ayesha: 'ಆಯಿಷಾ',
    basavva: 'ಬಸವ್ವ',
    bhagya: 'ಭಾಗ್ಯಾ',
    bhagyashree: 'ಭಾಗ್ಯಶ್ರೀ',
    bhavana: 'ಭಾವನಾ',
    bhavani: 'ಭವಾನಿ',
    bhoomika: 'ಭೂಮಿಕಾ',
    bindu: 'ಬಿಂದು',
    chaithra: 'ಚೈತ್ರಾ',
    chaitra: 'ಚೈತ್ರಾ',
    chandana: 'ಚಂದನಾ',
    chetana: 'ಚೇತನಾ',
    deepa: 'ದೀಪಾ',
    deepika: 'ದೀಪಿಕಾ',
    devika: 'ದೇವಿಕಾ',
    divya: 'ದಿವ್ಯಾ',
    dyamavva: 'ದ್ಯಾಮವ್ವ',
    fatima: 'ಫಾತಿಮಾ',
    gangavva: 'ಗಂಗವ್ವ',
    gayatri: 'ಗಾಯತ್ರಿ',
    geeta: 'ಗೀತಾ',
    geetha: 'ಗೀತಾ',
    girija: 'ಗಿರಿಜಾ',
    gita: 'ಗೀತಾ',
    gowri: 'ಗೌರಿ',
    gouri: 'ಗೌರಿ',
    hema: 'ಹೇಮಾ',
    indu: 'ಇಂದು',
    jayashree: 'ಜಯಶ್ರೀ',
    jyoti: 'ಜ್ಯೋತಿ',
    jyothi: 'ಜ್ಯೋತಿ',
    kalpana: 'ಕಲ್ಪನಾ',
    kamala: 'ಕಮಲಾ',
    kavita: 'ಕವಿತಾ',
    kavitha: 'ಕವಿತಾ',
    kavya: 'ಕಾವ್ಯಾ',
    keerthi: 'ಕೀರ್ತಿ',
    keerti: 'ಕೀರ್ತಿ',
    komal: 'ಕೋಮಲ',
    kusum: 'ಕುಸುಮ',
    kusuma: 'ಕುಸುಮಾ',
    lakshmi: 'ಲಕ್ಷ್ಮಿ',
    laxmi: 'ಲಕ್ಷ್ಮಿ',
    lalita: 'ಲಲಿತಾ',
    lalitha: 'ಲಲಿತಾ',
    madhuri: 'ಮಾಧುರಿ',
    mallavva: 'ಮಲ್ಲವ್ವ',
    mamata: 'ಮಮತಾ',
    mamatha: 'ಮಮತಾ',
    manjula: 'ಮಂಜುಳಾ',
    megha: 'ಮೇಘಾ',
    muskan: 'ಮುಸ್ಕಾನ',
    nagaratna: 'ನಾಗರತ್ನ',
    nalini: 'ನಳಿನಿ',
    nandini: 'ನಂದಿನಿ',
    netra: 'ನೇತ್ರಾ',
    netravati: 'ನೇತ್ರಾವತಿ',
    ningavva: 'ನಿಂಗವ್ವ',
    nirmala: 'ನಿರ್ಮಲಾ',
    padma: 'ಪದ್ಮಾ',
    padmavati: 'ಪದ್ಮಾವತಿ',
    pallavi: 'ಪಲ್ಲವಿ',
    parvati: 'ಪಾರ್ವತಿ',
    parvatavva: 'ಪಾರ್ವತವ್ವ',
    pooja: 'ಪೂಜಾ',
    poornima: 'ಪೂರ್ಣಿಮಾ',
    pratibha: 'ಪ್ರತಿಭಾ',
    prabhavati: 'ಪ್ರಭಾವತಿ',
    preeti: 'ಪ್ರೀತಿ',
    priti: 'ಪ್ರೀತಿ',
    priyanka: 'ಪ್ರಿಯಾಂಕಾ',
    priya: 'ಪ್ರಿಯಾ',
    pushpa: 'ಪುಷ್ಪಾ',
    pushpalata: 'ಪುಷ್ಪಲತಾ',
    radha: 'ರಾಧಾ',
    radhika: 'ರಾಧಿಕಾ',
    rajani: 'ರಜನಿ',
    rajeshwari: 'ರಾಜೇಶ್ವರಿ',
    rakshita: 'ರಕ್ಷಿತಾ',
    rakshitha: 'ರಕ್ಷಿತಾ',
    rashmi: 'ರಶ್ಮಿ',
    ratna: 'ರತ್ನ',
    rekha: 'ರೇಖಾ',
    renuka: 'ರೇಣುಕಾ',
    rohin: 'ರೋಹಿಣಿ',
    rohini: 'ರೋಹಿಣಿ',
    roopa: 'ರೂಪಾ',
    rupa: 'ರೂಪಾ',
    sahana: 'ಸಹನಾ',
    sangeeta: 'ಸಂಗೀತಾ',
    sangeetha: 'ಸಂಗೀತಾ',
    sania: 'ಸಾನಿಯಾ',
    sarita: 'ಸರಿತಾ',
    saroj: 'ಸರೋಜ',
    saroja: 'ಸರೋಜಾ',
    sarvamangala: 'ಸರ್ವಮಂಗಳಾ',
    savita: 'ಸವಿತಾ',
    savitha: 'ಸವಿತಾ',
    seema: 'ಸೀಮಾ',
    shabana: 'ಶಬಾನಾ',
    shaila: 'ಶೈಲಾ',
    shailaja: 'ಶೈಲಜಾ',
    shanta: 'ಶಾಂತಾ',
    shantavva: 'ಶಾಂತವ್ವ',
    sharada: 'ಶಾರದಾ',
    shilpa: 'ಶಿಲ್ಪಾ',
    shobha: 'ಶೋಭಾ',
    shreya: 'ಶ್ರೇಯಾ',
    shruti: 'ಶ್ರುತಿ',
    shruthi: 'ಶ್ರುತಿ',
    simran: 'ಸಿಮ್ರನ',
    sindhu: 'ಸಿಂಧು',
    sneha: 'ಸ್ನೇಹಾ',
    soumya: 'ಸೌಮ್ಯ',
    sowmya: 'ಸೌಮ್ಯ',
    sujata: 'ಸುಜಾತಾ',
    sujatha: 'ಸುಜಾತಾ',
    sukanya: 'ಸುಕನ್ಯಾ',
    suma: 'ಸುಮಾ',
    sumalata: 'ಸುಮಲತಾ',
    sumitra: 'ಸುಮಿತ್ರಾ',
    sunita: 'ಸುನೀತಾ',
    suneeta: 'ಸುನೀತಾ',
    sunitha: 'ಸುನೀತಾ',
    supriya: 'ಸುಪ್ರಿಯಾ',
    sushma: 'ಸುಷ್ಮಾ',
    swati: 'ಸ್ವಾತಿ',
    swathi: 'ಸ್ವಾತಿ',
    tanuja: 'ತನುಜಾ',
    uma: 'ಉಮಾ',
    usha: 'ಉಷಾ',
    vani: 'ವಾಣಿ',
    varsha: 'ವರ್ಷಾ',
    vidya: 'ವಿದ್ಯಾ',
    vijaya: 'ವಿಜಯಾ',
    vijayalakshmi: 'ವಿಜಯಲಕ್ಷ್ಮಿ',
    vimala: 'ವಿಮಲಾ',
    vinutha: 'ವಿನುತಾ',
    yallavva: 'ಯಲ್ಲವ್ವ',
    yashodha: 'ಯಶೋದಾ',
    zoya: 'ಜೋಯಾ',

  // Surnames / Family Names / Castes
    agasar: 'ಅಗಸರ',
    angadi: 'ಅಂಗಡಿ',
    badiger: 'ಬಡಿಗೇರ',
    bagwan: 'ಬಾಗವಾನ',
    bandi: 'ಬಂಡಿ',
    bellad: 'ಬೆಲ್ಲದ',
    bepari: 'ಬೇಪಾರಿ',
    bhat: 'ಭಟ',
    bhovi: 'ಭೋವಿ',
    bilagi: 'ಬೀಳಗಿ',
    biradar2: 'ಬಿರಾದಾರ',
    byahatti: 'ಬ್ಯಾಹಟ್ಟಿ',
    byali: 'ಬ್ಯಾಳಿ',
    chalawadi: 'ಚಲವಾದಿ',
    chaluvadi: 'ಚಲುವಾದಿ',
    chapparband: 'ಚಪ್ಪರಬಂದ',
    chavan: 'ಚವ್ಹಾಣ',
    chavanji: 'ಚವ್ಹಾಣ',
    dalawai: 'ದಳವಾಯಿ',
    desai: 'ದೇಸಾಯಿ',
    deshpande: 'ದೇಶಪಾಂಡೆ',
    devadiga: 'ದೇವಾಡಿಗ',
    gaddi: 'ಗಡ್ಡಿ',
    gani: 'ಗಣಿ',
    gouda: 'ಗೌಡ',
    gowda: 'ಗೌಡ',
    goudar: 'ಗೌಡರ',
    hadapad: 'ಹಡಪದ',
    hegde: 'ಹೆಗಡೆ',
    hiremath: 'ಹಿರೇಮಠ',
    holi: 'ಹೊಳಿ',
    hosamani: 'ಹೊಸಮನಿ',
    hugar: 'ಹೂಗಾರ',
    hukkeri: 'ಹುಕ್ಕೇರಿ',
    inamdar: 'ಇನಾಂದಾರ',
    jadhav: 'ಜಾಧವ',
    jangam: 'ಜಂಗಮ',
    joshi: 'ಜೋಷಿ',
    kabbur: 'ಕಬ್ಬೂರ',
    kambar: 'ಕಂಬಾರ',
    kamble: 'ಕಾಂಬ್ಳೆ',
    kammar: 'ಕಮ್ಮಾರ',
    khan: 'ಖಾನ್',
    koli: 'ಕೋಳಿ',
    koppad: 'ಕೊಪ್ಪದ',
    koraga: 'ಕೊರಗ',
    kulkarni: 'ಕುಲಕರ್ಣಿ',
    kumbar: 'ಕುಂಬಾರ',
    kurabar: 'ಕುರುಬರ',
    kuruba: 'ಕುರುಬ',
    lamani: 'ಲಮಾಣಿ',
    madar: 'ಮಾದರ',
    mali: 'ಮಾಳಿ',
    maratha: 'ಮರಾಠಾ',
    meti: 'ಮೇಟಿ',
    mulla: 'ಮುಲ್ಲಾ',
    nadaf: 'ನದಾಪ',
    naik: 'ನಾಯಕ',
    nayak: 'ನಾಯಕ',
    nayaka: 'ನಾಯಕ',
    patel: 'ಪಟೇಲ',
    patil: 'ಪಾಟೀಲ',
    pinjar: 'ಪಿಂಜಾರ',
    poojari: 'ಪೂಜಾರಿ',
    pujari: 'ಪೂಜಾರಿ',
    qureshi: 'ಖುರೇಷಿ',
    rathod: 'ರಾಠೋಡ',
    reddy: 'ರೆಡ್ಡಿ',
    sayed: 'ಸಯ್ಯದ',
    sayyed: 'ಸಯ್ಯದ',
    shaikh: 'ಶೇಖ್',
    sheikh: 'ಶೇಖ್',
    shetty: 'ಶೆಟ್ಟಿ',
    shinde: 'ಶಿಂಧೆ',
    shirahatti: 'ಶಿರಹಟ್ಟಿ',
    talawar: 'ತಳವಾರ',
    talwar: 'ತಳವಾರ',
    upadhye: 'ಉಪಾಧ್ಯೆ',
    valmiki: 'ವಾಲ್ಮೀಕಿ',
    yadawad: 'ಯಾದವಾಡ',

  // Common titles, relations & suffixes
    bai: 'ಬಾಯಿ',
    amma: 'ಅಮ್ಮ',
    avva: 'ಅವ್ವ',
    appa: 'ಅಪ್ಪ',
    anna: 'ಅಣ್ಣ',
    swamy: 'ಸ್ವಾಮಿ',
    swami: 'ಸ್ವಾಮಿ',
    shri: 'ಶ್ರೀ',
    sri: 'ಶ್ರೀ',
    smt: 'ಶ್ರೀಮತಿ',
    shrimati: 'ಶ್ರೀಮತಿ',
    kumari: 'ಕುಮಾರಿ',
    kum: 'ಕುಮಾರಿ',
    dr: 'ಡಾ.',
    adv: 'ವಕೀಲ',
};

// Initial single letters / abbreviations (e.g. "R.", "S.R.", "B.")
const SINGLE_LETTER_MAP: Record<string, string> = {
    a: 'ಎ.',   b: 'ಬಿ.',   c: 'ಸಿ.',   d: 'ಡಿ.',   e: 'ಇ.',   f: 'ಎಫ್.',
    g: 'ಜಿ.',   h: 'ಎಚ್.',   i: 'ಐ.',   j: 'ಜೆ.',   k: 'ಕೆ.',   l: 'ಎಲ್.',
    m: 'ಎಂ.',   n: 'ಎನ್.',   o: 'ಒ.',   p: 'ಪಿ.',   q: 'ಕ್ಯೂ.',   r: 'ಆರ್.',
    s: 'ಎಸ್.',   t: 'ಟಿ.',   u: 'ಯು.',   v: 'ವಿ.',   w: 'ಡಬ್ಲ್ಯೂ.',   x: 'ಎಕ್ಸ್.',
    y: 'ವೈ.', z: 'ಝಡ್.'
};

/**
 * High-accuracy algorithmic phonetic transliterator from English to Kannada script.
 * For words not in the Karnataka names dictionary.
 */

const VIRAMA_EXCEPTIONS = new Set([
  'ಖಾನ್', 'ಸಿಂಗ್', 'ಬೇಗ್', 'ಶೇಖ್', 'ಮೀರ್', 'ಶಾಹ್', 'ಜೈದ್', 'ಅಸದ್', 'ಅಹ್ಮದ್', 'ರಾವ್'
]);

export const cleanIndianEnding = (str: string): string => {
  if (!str) return str;
  let s = str.replace(/[\u200B-\u200D\uFEFF]+$/g, '');
  if (VIRAMA_EXCEPTIONS.has(s)) return s;
  while (s.endsWith('್') && !VIRAMA_EXCEPTIONS.has(s)) {
    s = s.slice(0, -1).replace(/[\u200B-\u200D\uFEFF]+$/g, '');
  }
  return s;
};

/**
 * Ensures all words in a Kannada name string (first name, middle name, last name/surname)
 * end with natural inherent vowel 'ಅ' and do not end in virama (ವ್ಯಂಜನ '್').
 */
export const cleanAllWordsEnding = (str: string): string => {
  if (!str) return str;
  return str
    .split(/(\s+|[-/().,])/)
    .map((token) => {
      if (!token || /^[\s\-_/().,]+$/.test(token) || /^\d+$/.test(token)) return token;
      return cleanIndianEnding(token);
    })
    .join('');
};

/**
 * Formats a 9-digit SATS number with a non-breaking space after every 3 digits (e.g. 123 689 095)
 * Guaranteed to stay on a single line with zero wrapping.
 */
export const formatSatsNo = (sats?: string | null): string => {
  if (!sats || sats === 'N/A' || sats === '-') return sats || '-';
  const clean = String(sats).replace(/\D/g, '');
  if (!clean) return String(sats);
  return clean.replace(/(\d{3})(?=\d)/g, '$1\u00A0').trim();
};

/**
 * Formats a 12-digit Aadhaar number with a non-breaking space after every 4 digits (e.g. 1234 5678 9012)
 * Guaranteed to stay on a single line with zero wrapping.
 */
export const formatAadharNo = (aadhar?: string | null): string => {
  if (!aadhar || aadhar === 'N/A' || aadhar === '-') return aadhar || '-';
  const clean = String(aadhar).replace(/\D/g, '');
  if (!clean) return String(aadhar);
  return clean.replace(/(\d{4})(?=\d)/g, '$1\u00A0').trim();
};

function phoneticWordToKannada(word: string): string {
  if (!word) return '';
  const w = word.toLowerCase();

  // If already mapped in dictionary, use dictionary directly
  if (KANNADA_NAME_DICTIONARY[w]) {
    return cleanIndianEnding(KANNADA_NAME_DICTIONARY[w]);
  }

  // Handle single letter initials (e.g. "S", "M", "R", "P.")
  const cleanWord = w.replace(/\./g, '');
  if (cleanWord.length === 1 && SINGLE_LETTER_MAP[cleanWord]) {
    return SINGLE_LETTER_MAP[cleanWord];
  }

  // Consonant definitions
  const CONSONANTS: [string, string][] = [
    ['ksha', 'ಕ್ಷ'], ['kshi', 'ಕ್ಷಿ'], ['kshu', 'ಕ್ಷು'], ['ksh', 'ಕ್ಷ್'],
    ['shra', 'ಶ್ರ'], ['shri', 'ಶ್ರೀ'], ['shru', 'ಶ್ರು'], ['shr', 'ಶ್ರ್'],
    ['jnya', 'ಜ್ಞ'], ['gnya', 'ಜ್ಞ'],
    ['chha', 'ಛ'], ['chhi', 'ಛಿ'], ['chhu', 'ಛು'], ['chh', 'ಛ್'],
    ['ch', 'ಚ'], ['jh', 'ಝ'], ['th', 'ಥ'], ['dh', 'ಧ'],
    ['kh', 'ಖ'], ['gh', 'ಘ'], ['bh', 'ಭ'], ['ph', 'ಫ'],
    ['sh', 'ಶ'], ['zh', 'ಳ'],
    ['k', 'ಕ'], ['g', 'ಗ'], ['j', 'ಜ'], ['t', 'ತ'], ['d', 'ದ'],
    ['n', 'ನ'], ['p', 'ಪ'], ['f', 'ಫ'], ['b', 'ಬ'], ['m', 'ಮ'],
    ['y', 'ಯ'], ['r', 'ರ'], ['l', 'ಲ'], ['v', 'ವ'], ['w', 'ವ'],
    ['s', 'ಸ'], ['h', 'ಹ'], ['c', 'ಕ'], ['q', 'ಕ'], ['x', 'ಕ್ಸ'], ['z', 'ಜ']
  ];

  // Initial Vowels (independent vowels)
  const INITIAL_VOWELS: [string, string][] = [
    ['aai', 'ಐ'], ['aau', 'ಔ'],
    ['aa', 'ಆ'], ['ee', 'ಈ'], ['oo', 'ಊ'],
    ['ai', 'ಐ'], ['au', 'ಔ'], ['ou', 'ಔ'],
    ['ea', 'ಏ'], ['oa', 'ಓ'],
    ['a', 'ಅ'], ['i', 'ಇ'], ['u', 'ಉ'], ['e', 'ಎ'], ['o', 'ಒ']
  ];

  // Dependent Vowel Signs (Matras)
  const MATRAS: [string, string][] = [
    ['aai', 'ೈ'], ['aau', 'ೌ'],
    ['aa', 'ಾ'], ['ee', 'ೀ'], ['oo', 'ೂ'],
    ['ai', 'ೈ'], ['au', 'ೌ'], ['ou', 'ೌ'],
    ['ea', 'ೇ'], ['oa', 'ೋ'],
    ['a', ''], ['i', 'ಿ'], ['u', 'ು'], ['e', 'ೆ'], ['o', 'ೊ']
  ];

  let result = '';
  let i = 0;
  const n = w.length;

  while (i < n) {
    // 1. Check if at start of word or after vowel: check for independent vowel
    const isAtStart = (i === 0);

    if (isAtStart) {
      let matchedVowel = false;
      for (const [vStr, knVowel] of INITIAL_VOWELS) {
        if (w.startsWith(vStr, i)) {
          result += knVowel;
          i += vStr.length;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    // 2. Check for Anusvara at end or before consonant (e.g. "am", "an" before consonant or at end)
    if ((w[i] === 'a' || w[i] === 'u') && (w[i + 1] === 'm' || w[i + 1] === 'n') && (i + 2 >= n || !'aeiou'.includes(w[i + 2]))) {
      // If preceded by consonant, replace halant with anusvara
      if (result.endsWith('್')) {
        result = result.slice(0, -1) + 'ಂ';
        i += 2;
        continue;
      }
    }

    // 3. Match consonant
    let matchedConsonant = false;
    for (const [cStr, knConsonant] of CONSONANTS) {
      if (w.startsWith(cStr, i)) {
        i += cStr.length;
        matchedConsonant = true;

        // Check following vowel
        let matchedMatra = false;
        for (const [mStr, knMatra] of MATRAS) {
          if (w.startsWith(mStr, i)) {
            // Apply matra directly to consonant (inherent 'a' has knMatra = '')
            result += knConsonant + knMatra;
            i += mStr.length;
            matchedMatra = true;
            break;
          }
        }

        // If no following vowel:
        if (!matchedMatra) {
          if (i >= n) {
            // At the end of word: Indian names end in the inherent 'ಅ' sound, NOT virama ('್')!
            result += knConsonant;
          } else {
            // In middle of word before another consonant (conjunct / ottakshara)
            result += knConsonant + '್';
          }
        }
        break;
      }
    }

    if (!matchedConsonant) {
      // Fallback: if solitary vowel in middle (e.g., diphthong), check matra
      let matchedSoloMatra = false;
      for (const [mStr, knMatra] of MATRAS) {
        if (w.startsWith(mStr, i)) {
          if (result.endsWith('್')) {
            result = result.slice(0, -1) + knMatra;
          } else {
            result += knMatra;
          }
          i += mStr.length;
          matchedSoloMatra = true;
          break;
        }
      }
      if (!matchedSoloMatra) {
        // Non-letter character (hyphen, quote, etc.) - keep as-is
        result += w[i];
        i++;
      }
    }
  }

  // Clean trailing unnecessary halant on certain vowels or punctuation
  return cleanIndianEnding(result);
}

/**
 * Transliterates an entire full name string (e.g. "RAHUL KUMAR PATIL") to Kannada.
 * - Preserves digits as Arabic/English (0-9).
 * - Preserves spaces, punctuation, hyphens.
 * - If text already has Kannada, returns unmodified.
 */
export const transliterateEnglishToKannada = (input: string): string => {
  if (!input) return '';
  const str = String(input).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'NA') return str;

  // If already Kannada, ensure all words (first, middle, and last names) have clean vowel endings
  if (containsKannada(str)) {
    return cleanAllWordsEnding(str);
  }

  // Split into tokens preserving delimiters (spaces, hyphens, slashes, brackets)
  const tokens = str.split(/(\s+|[-/().,])/);

  const translatedTokens = tokens.map((token) => {
    if (!token) return '';
    // Preserve whitespace & punctuation
    if (/^[\s\-_/().,]+$/.test(token)) return token;

    // Preserves Arabic/English numbers (0-9) strictly: "don't use Kannada numbers any where"
    if (/^\d+$/.test(token)) return token;

    // Word lookup & transliteration
    return phoneticWordToKannada(token);
  });

  const joined = translatedTokens.join('').replace(/\s+/g, ' ').trim();
  return cleanAllWordsEnding(joined);
};

/**
 * Translates a Student's names (studentName, fatherName, motherName) to Kannada.
 * Saves the original English names safely in originalStudentName, originalFatherName, originalMotherName.
 * Ensures every word (first name, middle name, last name/surname) ends with natural vowel 'ಅ' and not virama '್'.
 */
export const translateStudentToKannada = (student: Student): Student => {
  // 1. Preserve original English names permanently
  const origStudent = student.originalStudentName && !containsKannada(student.originalStudentName)
    ? student.originalStudentName
    : (!containsKannada(student.studentName) ? student.studentName : (student.originalStudentName || ''));

  const origFather = student.originalFatherName && !containsKannada(student.originalFatherName)
    ? student.originalFatherName
    : (!containsKannada(student.fatherName) ? student.fatherName : (student.originalFatherName || ''));

  const origMother = student.originalMotherName && !containsKannada(student.originalMotherName)
    ? student.originalMotherName
    : (!containsKannada(student.motherName) ? student.motherName : (student.originalMotherName || ''));

  // 2. Transliterate or preserve user-edited Kannada names:
  // If the student already has an explicit Kannada name (in studentNameKn or studentName), PRESERVE IT!
  // Only generate a new transliteration from English if no Kannada name exists yet.
  let knStudent: string;
  if (student.studentNameKn && containsKannada(student.studentNameKn)) {
    knStudent = cleanAllWordsEnding(student.studentNameKn);
  } else if (student.studentName && containsKannada(student.studentName)) {
    knStudent = cleanAllWordsEnding(student.studentName);
  } else if (origStudent) {
    knStudent = transliterateEnglishToKannada(origStudent);
  } else {
    knStudent = cleanAllWordsEnding(student.studentName || '');
  }

  let knFather: string;
  if (student.fatherNameKn && containsKannada(student.fatherNameKn)) {
    knFather = cleanAllWordsEnding(student.fatherNameKn);
  } else if (student.fatherName && containsKannada(student.fatherName)) {
    knFather = cleanAllWordsEnding(student.fatherName);
  } else if (origFather && origFather !== '-') {
    knFather = transliterateEnglishToKannada(origFather);
  } else {
    knFather = student.fatherName && student.fatherName !== '-' ? cleanAllWordsEnding(student.fatherName) : '-';
  }

  let knMother: string;
  if (student.motherNameKn && containsKannada(student.motherNameKn)) {
    knMother = cleanAllWordsEnding(student.motherNameKn);
  } else if (student.motherName && containsKannada(student.motherName)) {
    knMother = cleanAllWordsEnding(student.motherName);
  } else if (origMother && origMother !== '-') {
    knMother = transliterateEnglishToKannada(origMother);
  } else {
    knMother = student.motherName && student.motherName !== '-' ? cleanAllWordsEnding(student.motherName) : '-';
  }

  return {
    ...student,
    originalStudentName: origStudent || student.originalStudentName || student.studentName,
    originalFatherName: origFather || student.originalFatherName || student.fatherName,
    originalMotherName: origMother || student.originalMotherName || student.motherName,
    studentNameKn: knStudent,
    fatherNameKn: knFather,
    motherNameKn: knMother,
    studentName: knStudent,
    fatherName: knFather,
    motherName: knMother,
    namesLanguage: 'kn',
  };
};

/**
 * Restores a Student's names to the exact initial English spellings.
 * Guaranteed zero loss of English spelling precision.
 */
export const restoreStudentToEnglish = (student: Student): Student => {
  const englishStudentName =
    student.originalStudentName && !containsKannada(student.originalStudentName)
      ? student.originalStudentName
      : (!containsKannada(student.studentName) ? student.studentName : (student.originalStudentName || ''));

  const englishFatherName =
    student.originalFatherName && !containsKannada(student.originalFatherName)
      ? student.originalFatherName
      : (!containsKannada(student.fatherName) ? student.fatherName : (student.originalFatherName || '-'));

  const englishMotherName =
    student.originalMotherName && !containsKannada(student.originalMotherName)
      ? student.originalMotherName
      : (!containsKannada(student.motherName) ? student.motherName : (student.originalMotherName || '-'));

  return {
    ...student,
    studentName: englishStudentName || student.studentName,
    fatherName: englishFatherName || student.fatherName,
    motherName: englishMotherName || student.motherName,
    namesLanguage: 'en',
  };
};

/**
 * Bulk switch student list language between 'kn' and 'en'.
 */
export const switchStudentsLanguage = (
  students: Student[],
  targetLang: 'kn' | 'en'
): Student[] => {
  if (targetLang === 'kn') {
    return students.map(translateStudentToKannada);
  } else {
    return students.map(restoreStudentToEnglish);
  }
};
