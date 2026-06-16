// Curated, authentic supplications (Quran + Sunnah). The bot SELECTS from this
// list to match a news event — it never invents the Arabic, translation, or
// source. This is a starter set; expand or have a scholar review entries here.
// Keep `arabic`, `translation`, and `source` accurate — they are posted verbatim.

export type CuratedDua = {
  id: string
  /** Theme labels the matcher uses to pick a dua for a news event. */
  themes: string[]
  arabic: string
  transliteration: string
  /** Plain-English meaning (canonical; used as-is for English bots). */
  translation: string
  /** Reference, e.g. a surah:ayah or a hadith collection. */
  source: string
}

export const DUA_LIBRARY: CuratedDua[] = [
  {
    id: "yunus",
    themes: ["distress", "hardship", "despair", "overwhelm", "crisis"],
    arabic: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
    transliteration: "La ilaha illa anta subhanaka inni kuntu mina-zzalimin.",
    translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    source: "Qur'an 21:87 (the supplication of Prophet Yunus)",
  },
  {
    id: "hayyu-qayyum",
    themes: ["distress", "relief", "global hardship", "overwhelm", "mercy"],
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
    transliteration: "Ya Hayyu Ya Qayyum, bi rahmatika astaghith.",
    translation: "O Ever-Living, O Sustainer, by Your mercy I seek relief.",
    source: "Sunan al-Tirmidhi",
  },
  {
    id: "hammi-hazan",
    themes: ["grief", "anxiety", "sorrow", "fear", "distress"],
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan.",
    translation: "O Allah, I seek refuge in You from anxiety and grief.",
    source: "Sahih al-Bukhari",
  },
  {
    id: "shifa",
    themes: ["illness", "health", "disease", "healing", "epidemic", "hospital"],
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ",
    transliteration: "Allahumma Rabban-nas, adhhibil-ba's, ishfi antash-Shafi, la shifa'a illa shifa'uk.",
    translation: "O Allah, Lord of mankind, remove the harm and heal, for You are the Healer; there is no healing but Your healing.",
    source: "Sahih al-Bukhari",
  },
  {
    id: "istirja",
    themes: ["death", "loss", "bereavement", "calamity", "disaster", "mourning"],
    arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا",
    transliteration: "Inna lillahi wa inna ilayhi raji'un. Allahumma ajurni fi musibati wa akhlif li khayran minha.",
    translation: "Indeed, to Allah we belong and to Him we return. O Allah, reward me in my affliction and replace it with something better.",
    source: "Sahih Muslim",
  },
  {
    id: "hasbunallah",
    themes: ["trust", "fear", "conflict", "war", "enemy", "danger"],
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "HasbunAllahu wa ni'mal-wakil.",
    translation: "Allah is sufficient for us, and He is the best Disposer of affairs.",
    source: "Qur'an 3:173",
  },
  {
    id: "sabran",
    themes: ["patience", "steadfastness", "conflict", "hardship", "perseverance"],
    arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا",
    transliteration: "Rabbana afrigh 'alayna sabran wa thabbit aqdamana.",
    translation: "Our Lord, pour upon us patience and make our steps firm.",
    source: "Qur'an 2:250",
  },
  {
    id: "tuzigh",
    themes: ["guidance", "steadfastness", "faith", "uncertainty"],
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً",
    transliteration: "Rabbana la tuzigh quloobana ba'da idh hadaytana wa hab lana min ladunka rahmah.",
    translation: "Our Lord, let not our hearts deviate after You have guided us, and grant us mercy from Yourself.",
    source: "Qur'an 3:8",
  },
  {
    id: "mustad-afin",
    themes: ["oppression", "injustice", "war", "refugees", "the vulnerable", "persecution"],
    arabic: "اللَّهُمَّ نَجِّ الْمُسْتَضْعَفِينَ مِنَ الْمُؤْمِنِينَ",
    transliteration: "Allahumma najjil-mustad'afina minal-mu'minin.",
    translation: "O Allah, deliver the oppressed and vulnerable among the believers.",
    source: "Reported in the Qunut al-Nazilah tradition",
  },
  {
    id: "dunya-akhirah",
    themes: ["wellbeing", "gratitude", "general", "mercy", "ease"],
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina 'adhaban-nar.",
    translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    source: "Qur'an 2:201",
  },
  {
    id: "la-yadurru",
    themes: ["protection", "safety", "harm", "disaster", "calamity"],
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Alim.",
    translation: "In the name of Allah, with whose name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
    source: "Sunan Abi Dawud, Jami' al-Tirmidhi",
  },
  {
    id: "rain",
    themes: ["drought", "famine", "rain", "harvest", "provision", "hunger"],
    arabic: "اللَّهُمَّ اسْقِنَا غَيْثًا مُغِيثًا مَرِيئًا نَافِعًا",
    transliteration: "Allahumma asqina ghaythan mughithan mari'an nafi'an.",
    translation: "O Allah, give us rain that relieves, is wholesome and beneficial.",
    source: "Sunan Abi Dawud",
  },
  {
    id: "ikhwan",
    themes: ["forgiveness", "unity", "ummah", "brotherhood", "reconciliation"],
    arabic: "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ",
    transliteration: "Rabbanaghfir lana wa li-ikhwaninal-ladhina sabaquna bil-iman.",
    translation: "Our Lord, forgive us and our brothers who preceded us in faith.",
    source: "Qur'an 59:10",
  },
]

const NORMALIZED = DUA_LIBRARY.map((d) => ({ ...d, id: d.id.trim() }))

export function getCuratedDua(id: string): CuratedDua | null {
  const needle = id.trim()
  return NORMALIZED.find((d) => d.id === needle) ?? null
}

/** Compact catalogue the matcher model sees: themes + meaning + cite-able source. */
export function curatedDuaCatalogue(): string {
  return NORMALIZED.map(
    (d) => `- themes: ${d.themes.join(", ")} — meaning: "${d.translation}" — source: ${d.source}`,
  ).join("\n")
}
