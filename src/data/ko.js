export const DAILY_QUOTES = [
    { ja: '시작이 반이다', kana: 'Sijagi banida', ro: 'Sijagi banida', zh: '好的开始是成功的一半' },
    { ja: '고생 끝에 낙이 온다', kana: 'Gosaeng kkeute nagi onda', ro: 'Gosaeng kkeute nagi onda', zh: '苦尽甘来' },
    { ja: '가는 말이 고와야 오는 말이 곱다', kana: 'Ganeun mari gowaya oneun mari gopda', ro: 'Ganeun mari gowaya oneun mari gopda', zh: '好言好语' },
    { ja: '티끌 모아 태산', kana: 'Tikkeul moa taesan', ro: 'Tikkeul moa taesan', zh: '积少成多' },
];

export const PRAISE_PHRASES = [
    '대박!', '잘했어요!', '완벽해요!', '해냈네요!', '훌륭해요!', '축하해요!'
];

export const BASE_VOCAB = [
    { id: 1, ja: '안녕하세요', kana: '안녕하세요', ro: 'Annyeonghaseyo', zh: '你好', en: 'Hello', tag: 'greet' },
    { id: 2, ja: '감사합니다', kana: '감사합니다', ro: 'Gamsahamnida', zh: '谢谢', en: 'Thank you', tag: 'greet' },
    { id: 3, ja: '좋은 아침', kana: '좋은 아침', ro: 'Joeun achim', zh: '早上好', en: 'Good Morning', tag: 'greet' },
    { id: 4, ja: '안녕히 가세요', kana: '안녕히 가세요', ro: 'Annyeonghi gaseyo', zh: '再见', en: 'Goodbye', tag: 'greet' },
    { id: 10, ja: '고양이', kana: '고양이', ro: 'Goyangi', zh: '猫', en: 'Cat', tag: 'animal' },
    { id: 11, ja: '강아지', kana: '강아지', ro: 'Gangaji', zh: '狗', en: 'Dog', tag: 'animal' },
    { id: 12, ja: '새', kana: '새', ro: 'Sae', zh: '鸟', en: 'Bird', tag: 'animal' },
    { id: 20, ja: '벚꽃', kana: '벚꽃', ro: 'Beotkkot', zh: '樱花', en: 'Cherry Blossom', tag: 'nature' },
    { id: 21, ja: '하늘', kana: '하늘', ro: 'Haneul', zh: '天空', en: 'Sky', tag: 'nature' },
    { id: 22, ja: '비', kana: '비', ro: 'Bi', zh: '雨', en: 'Rain', tag: 'nature' },
    { id: 30, ja: '나', kana: '나', ro: 'Na', zh: '我', en: 'I / Me', tag: 'person' },
    { id: 31, ja: '학생', kana: '학생', ro: 'Haksaeng', zh: '学生', en: 'Student', tag: 'person' },
    { id: 32, ja: '선생님', kana: '선생님', ro: 'Seonsaengnim', zh: '老师', en: 'Teacher', tag: 'person' },
    { id: 40, ja: '귀엽다', kana: '귀엽다', ro: 'Gwiyeopda', zh: '可爱', en: 'Cute', tag: 'adj' },
    { id: 41, ja: '대박', kana: '대박', ro: 'Daebak', zh: '厉害/大发', en: 'Amazing', tag: 'adj' },
    { id: 42, ja: '맛있다', kana: '맛있다', ro: 'Masitda', zh: '好吃', en: 'Delicious', tag: 'adj' },
    { id: 50, ja: '먹다', kana: '먹다', ro: 'Meokda', zh: '吃', en: 'To Eat', tag: 'verb' },
    { id: 52, ja: '가다', kana: '가다', ro: 'Gada', zh: '去', en: 'To Go', tag: 'verb' },
];

export const CLOUD_VOCAB = [
    { id: 101, ja: '약속', kana: '약속', ro: 'Yaksok', zh: '约定', en: 'Promise', tag: 'cloud' },
    { id: 102, ja: '미래', kana: '미래', ro: 'Mirae', zh: '未来', en: 'Future', tag: 'cloud' },
    { id: 103, ja: '세계', kana: '세계', ro: 'Segye', zh: '世界', en: 'World', tag: 'cloud' },
    { id: 105, ja: '우주', kana: '우주', ro: 'Uju', zh: '宇宙', en: 'Universe', tag: 'cloud' },
    { id: 106, ja: '컴퓨터', kana: '컴퓨터', ro: 'Keompyuteo', zh: '电脑', en: 'Computer', tag: 'cloud' },
    { id: 107, ja: '스마트폰', kana: '스마트폰', ro: 'Seumateupon', zh: '智能手机', en: 'Smartphone', tag: 'cloud' },
    { id: 108, ja: '드라마', kana: '드라마', ro: 'Deurama', zh: '电视剧', en: 'Drama', tag: 'cloud' },
];

// h: Consonants (子音), k: Vowels (母音)
export const ALPHABET_DATA = [
    { r: 'g', h: 'ㄱ', k: 'ㅏ' }, { r: 'n', h: 'ㄴ', k: 'ㅑ' }, { r: 'd', h: 'ㄷ', k: 'ㅓ' }, { r: 'r/l', h: 'ㄹ', k: 'ㅕ' }, { r: 'm', h: 'ㅁ', k: 'ㅗ' },
    { r: 'b', h: 'ㅂ', k: 'ㅛ' }, { r: 's', h: 'ㅅ', k: 'ㅜ' }, { r: 'ng', h: 'ㅇ', k: 'ㅠ' }, { r: 'j', h: 'ㅈ', k: 'ㅡ' }, { r: 'ch', h: 'ㅊ', k: 'ㅣ' },
    { r: 'k', h: 'ㅋ', k: 'ㅐ' }, { r: 't', h: 'ㅌ', k: 'ㅒ' }, { r: 'p', h: 'ㅍ', k: 'ㅔ' }, { r: 'h', h: 'ㅎ', k: 'ㅖ' },
    { r: 'kk', h: 'ㄲ', k: 'ㅘ' }, { r: 'tt', h: 'ㄸ', k: 'ㅙ' }, { r: 'pp', h: 'ㅃ', k: 'ㅚ' }, { r: 'ss', h: 'ㅆ', k: 'ㅝ' }, { r: 'jj', h: 'ㅉ', k: 'ㅞ' },
];

export const LABELS = {
    tab1Key: 'tabHangul',
    tab1_sub1Key: 'subConsonants',
    tab1_sub2Key: 'subVowels',
    langNameKey: 'langKo',
    flag: '🇰🇷'
};
