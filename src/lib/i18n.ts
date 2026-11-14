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
    siteName: "wtfe2",
    tagline: "WTF, Engineer?",
    description:
      "Comics about the strange job of building software, collected from the web. The openly licensed ones are lettered in Japanese; the rest are introduced and linked.",
    navComics: "Comics",
    navShelf: "Shelf",
    navAbout: "About",
    switchTo: "日本語",
    switchLabel: "Read this page in Japanese",
    translated: "Lettered in Japanese",
    translatedLede:
      "Strips published under a Creative Commons license that allows adaptation. Each page shows the original; the Japanese edition swaps the lettering on a cleaned copy of the art.",
    shelf: "The shelf",
    shelfLede:
      "Ten places worth following. Three allow adaptation and are lettered here; the others reserve their rights, so they are described and linked, and the comics stay on their own sites.",
    seeShelf: "See the whole shelf",
    originalTitle: "Original title",
    by: "by",
    published: "Published",
    dateUnknown: "date not recorded",
    license: "License",
    hoverText: "Hover text",
    whyItLands: "Why it lands",
    related: "Related",
    transcript: "Transcript",
    original: "Original",
    showOriginal: "Show the original lettering",
    credits: "Credits",
    creditOriginal: "Original",
    creditImage: "Image file",
    creditModified:
      "The English page shows the original image unmodified. The Japanese page shows an adaptation by wtfe2: the lettering was erased from the art and replaced with a Japanese translation. The adaptation is shared under the same license as the original.",
    prev: "Previous",
    next: "Next",
    status: { active: "Active", irregular: "Irregular", dormant: "Quiet", ended: "Ended" },
    since: "since",
    latest: "Latest seen",
    checked: "Checked",
    feed: "Feed",
    termsLabel: "Reuse terms",
    tier: { translated: "Lettered here", linked: "Linked only" },
    picks: "Start with",
    readOn: "Read on the original site",
    comicsHere: "On this site",
    aboutTitle: "About wtfe2",
    footerContent:
      "Site text and translations: CC BY-NC-SA 4.0. Comics: their creators, under the licenses shown on each page.",
    footerCode: "Code: MIT.",
    footerSource: "Source on GitHub",
    footerIssue: "Report a problem",
    notFound: "Page not found",
    notFoundLede: "Nothing is lettered here. Try the home page.",
    home: "Home",
    skip: "Skip to content",
  },
  ja: {
    siteName: "wtfe2",
    tagline: "WTF, Engineer?",
    description:
      "ソフトウェアを作るという奇妙な仕事を描いた漫画を、Web から集めて紹介する。改変が許されているものは日本語に描き文字を差し替え、それ以外は紹介してリンクする。",
    navComics: "作品",
    navShelf: "本棚",
    navAbout: "このサイト",
    switchTo: "English",
    switchLabel: "このページを英語で読む",
    translated: "日本語版",
    translatedLede:
      "改変を認める Creative Commons ライセンスで公開されている作品。描き文字を消した原画の上に日本語を載せている。各ページで原文にも切り替えられる。",
    shelf: "本棚",
    shelfLede:
      "追いかける価値のある 10 サイト。うち 3 つは改変が許されているので、ここで日本語にしている。残りは権利が留保されているので、作品は元のサイトに置いたまま紹介とリンクだけにしている。",
    seeShelf: "本棚をすべて見る",
    originalTitle: "原題",
    by: "作",
    published: "公開",
    dateUnknown: "公開日の記録なし",
    license: "ライセンス",
    hoverText: "ホバーテキスト",
    whyItLands: "どこが刺さるか",
    related: "関連",
    transcript: "書き起こし",
    original: "原文",
    showOriginal: "原文の描き文字を表示",
    credits: "クレジット",
    creditOriginal: "原作",
    creditImage: "画像ファイル",
    creditModified:
      "英語版のページは原画をそのまま表示している。日本語版のページは wtfe2 による翻案で、原画から描き文字を消し、日本語訳に差し替えている。翻案は原作と同じライセンスで公開する。",
    prev: "前へ",
    next: "次へ",
    status: { active: "更新中", irregular: "不定期", dormant: "休止気味", ended: "終了" },
    since: "開始",
    latest: "確認した最新回",
    checked: "確認日",
    feed: "フィード",
    termsLabel: "利用条件",
    tier: { translated: "日本語版あり", linked: "リンクのみ" },
    picks: "まずはこれ",
    readOn: "元のサイトで読む",
    comicsHere: "このサイトの日本語版",
    aboutTitle: "wtfe2 について",
    footerContent: "サイトの文章と翻訳: CC BY-NC-SA 4.0。漫画の権利は各作者にあり、ライセンスは各ページに記載。",
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
