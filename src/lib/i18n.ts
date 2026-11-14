export const LANGS = ["en", "ja"] as const;
export type Lang = (typeof LANGS)[number];

const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/** Site-relative path (no leading slash) to an absolute URL path for one language. */
export function href(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return `${base}${lang === "ja" ? "ja/" : ""}${clean}`;
}

/** Path to a static asset under public/. */
export function asset(path: string): string {
  return `${base}${path.replace(/^\/+/, "")}`;
}

export function other(lang: Lang): Lang {
  return lang === "en" ? "ja" : "en";
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number?];
  if (lang === "ja") return d ? `${y}年${m}月${d}日` : `${y}年${m}月`;
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
}

export const ui = {
  en: {
    siteName: "wtfe²",
    tagline: "WTF, Engineer?",
    description:
      "Comics about the strange job of building software, collected from the web. The openly licensed ones are lettered in Japanese; the rest are explained in our own words, each with what to take away from it.",
    navComics: "Comics",
    navSites: "Sites",
    navAbout: "About",
    switchTo: "日本語",
    translated: "Lettered in Japanese",
    translatedLede:
      "Strips published under a Creative Commons license that allows adaptation. Each page shows the original; the Japanese edition swaps the lettering on a cleaned copy of the art.",
    sites: "Sites",
    sitesLede:
      "Places worth following. The ones whose license allows adaptation are lettered here; the others do not allow it, so their strips stay on their own sites and are explained here in our own words.",
    seeSites: "All sites",
    originalTitle: "Original title",
    by: "by",
    published: "Published",
    dateUnknown: "date not recorded",
    license: "License",
    hoverText: "Hover text",
    whyItLands: "Why it lands",
    takeaway: "Takeaway",
    explained: "Explained here",
    explainedLede:
      "Strips from sites that do not allow adaptation, retold in our own words with what to take away from them. CommitStrip allows its strips to illustrate an article, so those are shown as published, with Japanese subtitles.",
    whatHappens: "What happens",
    subtitles: "Dialogue",
    readOriginal: "Read the original",
    readExplainer: "Our explainer",
    article: "Article",
    related: "Related",
    transcript: "Transcript",
    original: "Original",
    showOriginal: "Show the original lettering",
    credits: "Credits",
    creditOriginal: "Original",
    creditImage: "Image file",
    creditFirst: "First published at",
    adaptedBy: "Japanese lettering by wtfe²",
    offline: "offline",
    creditModified:
      "The English page shows the original image unmodified. The Japanese page shows an adaptation by wtfe²: the lettering was erased from the art and replaced with a Japanese translation. The adaptation is shared under the same license as the original.",
    prev: "Previous",
    next: "Next",
    status: { active: "Active", irregular: "Irregular", dormant: "Quiet", ended: "Ended" },
    since: "since",
    latest: "Latest seen",
    checked: "Checked",
    feed: "Feed",
    termsLabel: "Reuse terms",
    permission: "Permission",
    tier: { translated: "Lettered here", linked: "Explained here" },
    picks: "Start with",
    readOn: "Read on the original site",
    comicsHere: "On this site",
    aboutTitle: "About wtfe²",
    footerContent:
      "Site text: CC BY-NC-SA 4.0. Comics and their translations: their creators' licenses, shown on each comic's page.",
    footerCode: "Code: MIT.",
    footerSource: "Source on GitHub",
    footerIssue: "Report a problem",
    notFound: "Page not found",
    notFoundLede: "Nothing is lettered here. Try the home page.",
    home: "Home",
    skip: "Skip to content",
  },
  ja: {
    siteName: "wtfe²",
    tagline: "WTF, Engineer?",
    description:
      "ソフトウェアを作るという奇妙な仕事を描いた漫画を、Web から集めて紹介する。改変が許されているものは描き文字を日本語に差し替え、それ以外は自分たちの言葉で解説し、そこから学べることを添える。",
    navComics: "作品",
    navSites: "漫画サイト",
    navAbout: "wtfe² について",
    switchTo: "English",
    translated: "日本語版",
    translatedLede:
      "改変を認める Creative Commons ライセンスで公開されている作品。描き文字を消した原画の上に日本語を載せている。各ページで原文にも切り替えられる。",
    sites: "漫画サイト",
    sitesLede:
      "追いかける価値のあるサイト。ライセンスが改変を認めているものはここで日本語にしている。残りは改変を認めていないので、作品は元のサイトに置いたまま、ここでは自分たちの言葉で解説している。",
    seeSites: "漫画サイトをすべて見る",
    originalTitle: "原題",
    by: "作",
    published: "公開",
    dateUnknown: "公開日の記録なし",
    license: "ライセンス",
    hoverText: "ホバーテキスト",
    whyItLands: "どこが刺さるか",
    takeaway: "ここから学べること",
    explained: "解説",
    explainedLede:
      "改変を認めていないサイトの作品を、自分たちの言葉で紹介し、そこから学べることを添えた。CommitStrip は記事の挿絵として使うことを認めているので、原画をそのまま載せ、日本語の字幕を付けている。",
    whatHappens: "あらすじ",
    subtitles: "セリフ",
    readOriginal: "原作を読む",
    readExplainer: "解説を読む",
    article: "記事",
    related: "関連",
    transcript: "書き起こし",
    original: "原文",
    showOriginal: "原文の描き文字を表示",
    credits: "クレジット",
    creditOriginal: "原作",
    creditImage: "画像ファイル",
    creditFirst: "初出",
    adaptedBy: "日本語版: wtfe²",
    offline: "現在は閲覧不可",
    creditModified:
      "英語版のページは原画をそのまま表示している。日本語版のページは wtfe² による翻案で、原画から描き文字を消し、日本語訳に差し替えている。翻案は原作と同じライセンスで公開する。",
    prev: "前へ",
    next: "次へ",
    status: { active: "更新中", irregular: "不定期", dormant: "休止気味", ended: "終了" },
    since: "開始",
    latest: "確認した最新回",
    checked: "確認日",
    feed: "フィード",
    termsLabel: "利用条件",
    permission: "許可",
    tier: { translated: "日本語版あり", linked: "解説あり" },
    picks: "まずはこれ",
    readOn: "元のサイトで読む",
    comicsHere: "このサイトの日本語版",
    aboutTitle: "wtfe² について",
    footerContent: "サイトの文章: CC BY-NC-SA 4.0。漫画とその翻訳: 各作品のライセンスに従う (各作品のページに記載)。",
    footerCode: "コード: MIT。",
    footerSource: "GitHub のソース",
    footerIssue: "問題を報告する",
    notFound: "ページが見つかりません",
    notFoundLede: "ここには何も描かれていない。トップページへどうぞ。",
    home: "トップ",
    skip: "本文へ移動",
  },
} as const;

export type UI = (typeof ui)[Lang];
