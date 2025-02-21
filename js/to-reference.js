/// <reference path="helper.js" />
/// <reference path="reference.js" />

(() => {
    const registerTextFileChange = Helper.Dom.registerTextFileChange;
    const copyElement = Helper.Dom.copyElement;
    const toggleElements = Helper.Dom.toggleElements;
    const showElements = Helper.Dom.showElements;
    const escapeRegexp = Helper.Regexp.escape;
    const parseJson = Reference.fromJson;
    const SourceType = Reference.SourceType;

    const RefFormat = Object.freeze({
        Apa: "APA",
        Tjs: "TJS",
        Chicago: "Chicago",
    });

    const Punc = Object.freeze({
        EndExp: /[.?!'’"”]$/,
        Space: " ",
        EnDash: "–",
        Hyphen: "-",
        Comma: ",",
        Ampersand: "&",
        Semicolon: ";",
        Period: ".",
        Colon: ":",
        QuoteL2: "“",
        QuoteR2: "”",
        ParenL: "(",
        ParenR: ")",
        BracketL: "[",
        BracketR: "]",
    });

    const DataAttr = Object.freeze({
        SearchText: "data-search-text",
    });

    class Builder {
        rangeDelimiter = Punc.EnDash;

        get doiHtml() {
            return this.doi ? Builder.toAnchorHtml(this.doi) : "";
        }

        get urlHtml() {
            return this.url ? Builder.toAnchorHtml(this.url) : "";
        }

        get doi() {
            return this.withDoi ? this.url : null;
        }

        get url() {
            return this.r.url || null;
        }

        get dateRangeMdText() {
            if (!this.r.dateFrom)
                throw new Error("DateFrom is not provided.")

            const d1 = this.r.dateFrom;
            const d2 = this.r.dateTo;

            const toMonthDate = d =>
                `${Builder.toMonthName(d)}${Punc.Space}${d.getDate()}`;
            const toToPart = () =>
                d1.getMonth() === d2.getMonth() ? `${d2.getDate()}` : toMonthDate(d2);

            const from = toMonthDate(d1);
            const to = d2 ? toToPart() : "";

            return [from, to].filter(x => x).join(this.rangeDelimiter);
        }

        /** @param {Reference} r @param {boolean} isHtml @param {boolean} withDoi */
        constructor(r, isHtml, withDoi = false) {
            this.r = r;
            this.isHtml = isHtml;
            this.withDoi = withDoi;
        }

        /** @param {string[]} texts */
        static wrapParen(...texts) {
            return Builder.wrapPunc(Punc.ParenL, Punc.ParenR, texts);
        }

        /** @param {string[]} texts */
        static wrapBracket(...texts) {
            return Builder.wrapPunc(Punc.BracketL, Punc.BracketR, texts);
        }

        /** @param {string[]} texts */
        static wrapQuote2(...texts) {
            return Builder.wrapPunc(Punc.QuoteL2, Punc.QuoteR2, texts);
        }

        /** @param {string} left @param {string} right @param {string[]} texts */
        static wrapPunc(left, right, texts) {
            const text = texts.join("");
            return text ? (left + text + right) : "";
        }

        /** @param {string[]} parts */
        static joinPartsSpace(...parts) {
            return parts.filter(x => x).join(Punc.Space);
        }

        /** @param {string} part @param {string} punc */
        static ensureEnd(part, punc) {
            const text = (() => {
                const $e = document.createElement('div');
                $e.innerHTML = part;
                return $e.textContent;
            })();

            if (punc === Punc.Period && Punc.EndExp.test(text))
                return part;

            if (text.endsWith(punc))
                return part;

            return part + punc;
        }

        /** @param {string} part */
        static toItalicHtml(part) {
            const $i = document.createElement("i");
            $i.innerText = part;

            return $i.outerHTML;
        }

        /** @param {string} url */
        static toAnchorHtml(url) {
            const $a = document.createElement("a");
            $a.innerText = url;
            $a.setAttribute("href", url);
            $a.setAttribute("target", "_blank");

            return $a.outerHTML;
        }

        /** @param {Date | number} value Date object or month number */
        static toMonthName(value) {
            const d = typeof value === typeof new Date
                ? value
                : new Date(`${(new Date).getFullYear()}-${value}-1`);

            return new Intl.DateTimeFormat("en-US", { month: "long" }).format(d);
        }

        build() {
            const hasAsIs = this.r.asIsParts.length > 0;
            const type = hasAsIs ? SourceType.AsIs : this.r.sourceType;

            const func = (new Map([
                [SourceType.JournalArticle, this.toJournalArticle],
                [SourceType.Book, this.toBook],
                [SourceType.ChapterInBook, this.toChapterInBook],
                [SourceType.ConferenceInBook, this.toChapterInBook],
                [SourceType.Conference, this.toConference],
                [SourceType.Degree, this.toDegree],
                [SourceType.Database, this.toDatabase],
                [SourceType.Webpage, this.toWebpage],
                [SourceType.AsIs, this.toAsIs],
            ])).get(type);

            if (!func)
                throw new Error("Given sourceType is invalid");

            return func.call(this);
        }

        toJournalArticle() {}
        toBook() {}
        toChapterInBook() {}
        toConference() {}
        toDegree() {}
        toDatabase() {}
        toWebpage() {}

        toAsIs() {
            let isItalic = false;
            const text = this.r.asIsParts.reduce((a, c) =>
                a + ((isItalic = !isItalic) ? this.toItalic(c) : c));

            return text + this.urlHtml;
        }

        /** @param {string} part */
        toItalic(part) {
            return this.isHtml ? Builder.toItalicHtml(part) : part;
        }
    }

    class ApaBuilder extends Builder {
        rangeDelimiter = Punc.EnDash;

        get authorsPart() {
            return Builder.ensureEnd(
                this.formatNames(this.r.authors),
                Punc.Period);
        }

        get datePart() {
            const m = this.r.month;
            const d = m ? this.r.day : null;
            const month = m ? Builder.toMonthName(m) : "";
            const day = d ? d : "";
            const year = `${this.r.year}${this.r.yearSuffix || ""}`;

            const md = [month, day].filter(x => x).join(Punc.Space);
            const ymd = [year, md].filter(x => x).join(Punc.Comma + Punc.Space);

            return Builder.wrapParen(ymd) + Punc.Period;
        }

        get editorsPart() {
            const eds = this.r.editors;

            if (typeof eds !== typeof [])
                throw new Error("Editors are not provided");

            const inPart = "In";
            const namesPart = this.formatNames(eds, true);
            const edsWord = eds.length === 1 ? "Ed" : "Eds";
            const edsPart = Builder.wrapParen(edsWord, Punc.Period);

            if (eds.length === 0)
                return inPart;

            return [inPart, namesPart, edsPart].join(Punc.Space) + Punc.Comma;
        }

        get editionRangePart() {
            const edVol = this.editionVolumePart;
            const pp = this.pageRangePart ? `pp. ${this.pageRangePart}` : "";
            const range = this.articleNumberPart || pp;
            const part = [edVol, range].filter(x => x).join(Punc.Comma + Punc.Space);

            return Builder.wrapParen(part);
        }

        get editionVolumePart() {
            const ed = this.r.edition || "";
            const vol = this.r.volumeNumber ? `Vol. ${this.r.volumeNumber}` : "";

            return [ed, vol].filter(x => x).join(Punc.Comma + Punc.Space);
        }

        get articleNumberPart() {
            if (typeof this.r.articleNumber !== typeof "")
                return "";

            return `Article${Punc.Space}${this.r.articleNumber}`;
        }

        get pageRangePart() {
            if (typeof this.r.pageFrom !== typeof 1)
                return "";

            if (typeof this.r.pageTo !== typeof 1)
                throw new Error("PageTo is not provided.");

            return `${this.r.pageFrom}${Punc.EnDash}${this.r.pageTo}`;
        }

        get publishersPart() {
            if (this.r.publishers.length === 0)
                throw new Error("Publishers are not provided.")

            return Builder.ensureEnd(
                this.r.publishers.join(Punc.Semicolon + Punc.Space),
                Punc.Period);
        }

        toJournalArticle() {
            const volume = this.r.volumeNumber ? `${this.r.volumeNumber}` : "";
            const issue = Builder.wrapParen(this.r.issueNumber);
            const articleRange = this.articleNumberPart || this.pageRangePart || "";

            const v = this.r.volumeNumber ? this.toItalic(volume) : "";
            const vi = v + issue;
            const periodical = [this.toItalic(this.r.periodical), vi, articleRange]
                .filter(x => x)
                .join(Punc.Comma + Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                Builder.ensureEnd(this.r.title, Punc.Period),
                Builder.ensureEnd(periodical, Punc.Period),
                this.doiHtml);
        }

        toBook() {
            const iBook = this.toItalic(this.r.title);
            const edVol = Builder.wrapParen(this.editionVolumePart);
            const bookEdVolPart = Builder.ensureEnd(
                [iBook, edVol].filter(x => x).join(Punc.Space),
                Punc.Period);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                bookEdVolPart,
                this.publishersPart,
                this.doiHtml);
        }

        toChapterInBook() {
            const iBook = this.toItalic(this.r.sourceTitle);
            const bookEdRangePart = Builder.ensureEnd(
                [iBook, this.editionRangePart].filter(x => x).join(Punc.Space),
                Punc.Period);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                Builder.ensureEnd(this.r.title, Punc.Period),
                this.editorsPart,
                bookEdRangePart,
                this.publishersPart,
                this.doiHtml);
        }

        toConference() {
            const y = this.r.dateFrom.getFullYear();
            const md = this.dateRangeMdText;
            const ymd = Builder.wrapParen(y, Punc.Comma, Punc.Space, md);
            const conferenceType = Builder.wrapBracket(this.r.conferenceType);
            const location = [this.r.city, this.r.state, this.r.country].filter(x => x)
                .join(Punc.Comma + Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                Builder.ensureEnd(ymd, Punc.Period),
                this.toItalic(this.r.title),
                Builder.ensureEnd(conferenceType, Punc.Period),
                Builder.ensureEnd(this.r.conference, Punc.Comma),
                Builder.ensureEnd(location, Punc.Period));
        }

        toDegree() {
            const degree = Builder.wrapBracket(this.r.degreeType, Punc.Comma, Punc.Space, this.r.university);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                this.r.title,
                Builder.ensureEnd(degree, Punc.Period),
                Builder.ensureEnd(this.r.database, Punc.Period),
                this.urlHtml);
        }

        toDatabase() {
            const iTitle = this.toItalic(this.r.title);
            const no = Builder.wrapParen(this.r.articleNumber);
            const titleNo = [iTitle, no].filter(x => x).join(Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                Builder.ensureEnd(titleNo, Punc.Period),
                Builder.ensureEnd(this.r.database, Punc.Period),
                this.urlHtml);
        }

        toWebpage() {
            const iTitle = this.toItalic(this.r.title);
            const sourceName = this.r.sourceName
                ? Builder.ensureEnd(this.r.sourceName, Punc.Period)
                : "";

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.datePart,
                Builder.ensureEnd(iTitle, Punc.Period),
                sourceName,
                this.urlHtml);
        }

        /** @param {string[]} names @param {boolean} disableCommaOnTwo */
        formatNames(names, disableCommaOnTwo = false) {
            if (names.length === 0)
                return "";

            if (names.length === 1)
                return names[0];

            const disableComma = names.length === 2 && disableCommaOnTwo;

            const lastIndex = names.length - 1;
            const lastName = names[lastIndex];
            const lastNamePart = `${Punc.Ampersand}${Punc.Space}${lastName}`;
            const delimiter = (disableComma ? "" : Punc.Comma) + Punc.Space;

            return names.slice(0, lastIndex).concat(lastNamePart).join(delimiter);
        }
    }

    class TjsBuilder extends Builder {
        rangeDelimiter = Punc.Hyphen;

        get authorsPart() {
            return Builder.ensureEnd(
                this.formatNames(this.r.authors),
                Punc.Comma);
        }

        get yearPart() {
            return Builder.ensureEnd(
                `${this.r.year}${this.r.yearSuffix || ""}`,
                Punc.Comma);
        }

        get italicTitlePart() {
            return Builder.ensureEnd(
                this.toItalic(this.r.title),
                Punc.Period);
        }

        get quoteTitlePart() {
            return Builder.wrapQuote2(Builder.ensureEnd(
                this.r.title,
                Punc.Period));
        }

        get articleNumberPart() {
            if (!this.r.articleNumber)
                return "";

            return `Article${Punc.Space}${this.r.articleNumber}`;
        }

        get pageRangePart() {
            if (!this.r.pageFrom || !this.r.pageTo)
                return "";

            return `${this.r.pageFrom}${Punc.Hyphen}${this.r.pageTo}`;
        }

        get editorsPart() {
            if (!this.r.editors.length)
                return "";

            return Builder.ensureEnd(
                `edited by ${this.formatNames(this.r.editors)}`,
                Punc.Period);
        }

        get publishersPart() {
            return Builder.ensureEnd(
                this.r.publishers[0],
                Punc.Period);
        }

        toJournalArticle() {
            const iPeriodical = this.toItalic(this.r.periodical);
            const vol = this.r.volumeNumber ? `${this.r.volumeNumber}` : "";
            const iss = Builder.wrapParen(this.r.issueNumber);
            const volIss = vol + iss;
            const range = this.articleNumberPart || this.pageRangePart || "";
            const volIssRange = [volIss, range].filter(x => x)
                .join(Punc.Colon + Punc.Space);
            const periodical = [iPeriodical, volIssRange].filter(x => x)
                .join(Punc.Comma + Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(periodical, Punc.Period));
        }

        toBook() {
            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.italicTitlePart,
                this.publishersPart);
        }

        toChapterInBook() {
            const pp = this.pageRangePart ? `Pp. ${this.pageRangePart}` : "";
            const range = this.articleNumberPart || pp || "";
            const iBook = this.toItalic(this.r.sourceTitle);
            const book = Builder.ensureEnd(`in ${iBook}`, Punc.Comma);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                range,
                book,
                this.editorsPart,
                this.publishersPart);
        }

        toConference() {
            const conference = `Paper presented at ${this.r.conference}`;
            const place = [this.r.city, this.r.state, this.r.country].filter(x => x)
                .join(Punc.Comma + Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(conference, Punc.Comma),
                Builder.ensureEnd(place, Punc.Comma),
                Builder.ensureEnd(this.dateRangeMdText, Punc.Period));
        }

        toDegree() {
            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.italicTitlePart,
                Builder.ensureEnd(this.r.degreeType, Punc.Comma),
                Builder.ensureEnd(this.r.university, Punc.Period));
        }

        toDatabase() {
            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(this.r.database, Punc.Period),
                this.urlHtml);
        }

        toWebpage() {
            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(this.r.sourceName, Punc.Period),
                this.urlHtml);
        }

        /** @param {string[]} names */
        formatNames(names) {
            if (names.length === 0)
                return "";

            if (names.length === 1)
                return names[0];

            const lastIndex = names.length - 1;
            const lastName = names[lastIndex];

            const delimiter = Punc.Comma + Punc.Space;
            const headPart = names.slice(0, lastIndex).join(delimiter);
            const tailPart = ` and ${lastName}`;

            return headPart + tailPart;
        }
    }

    class ChicagoBuilder extends Builder {
        rangeDelimiter = Punc.EnDash;

        get authorsPart() {
            const authors = this.r.authors;
            const names = [authors[0]].concat(authors.slice(1).map(this.toForeSur));

            return Builder.ensureEnd(
                this.formatNames(names, false),
                Punc.Period);
        }

        get yearPart() {
            return Builder.ensureEnd(
                `${this.r.year}${this.r.yearSuffix || ""}`,
                Punc.Period);
        }

        get italicTitlePart() {
            return Builder.ensureEnd(
                this.toItalic(this.r.title),
                Punc.Period);
        }

        get quoteTitlePart() {
            return Builder.wrapQuote2(Builder.ensureEnd(
                this.r.title,
                Punc.Period));
        }

        get articleNumberPart() {
            if (!this.r.articleNumber)
                return "";

            return `${this.r.articleNumber}`;
        }

        get pageRangePart() {
            if (!this.r.pageFrom || !this.r.pageTo)
                return "";

            return `${this.r.pageFrom}${Punc.EnDash}${this.r.pageTo}`;
        }

        get editorsPart() {
            if (!this.r.editors.length)
                return "";

            const names = this.r.editors.map(this.toForeSur);

            return `edited by ${this.formatNames(names, true)}`;
        }

        get publishersPart() {
            return Builder.ensureEnd(
                this.r.publishers[0],
                Punc.Period);
        }

        toJournalArticle() {
            const iPeriodical = this.toItalic(this.r.periodical);
            const vol = this.r.volumeNumber ? `${this.r.volumeNumber}` : "";
            const iss = Builder.wrapParen(this.r.issueNumber);
            const volIss = [vol, iss].filter(x => x).join(Punc.Space);
            const range = this.articleNumberPart || this.pageRangePart || "";
            const volRangePunc = Punc.Colon + (iss ? Punc.Space : "");
            const volIssRange = [volIss, range].filter(x => x)
                .join(volRangePunc);
            const periodical = [iPeriodical, volIssRange].filter(x => x)
                .join(Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(periodical, Punc.Period),
                this.doiHtml);
        }

        toBook() {
            const ed = this.r.edition ? `${this.r.edition} ed.` : "";
            const vol = this.r.volumeNumber ? `Vol. ${this.r.volumeNumber}.` : "";

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.italicTitlePart,
                ed,
                vol,
                this.publishersPart);
        }

        toChapterInBook() {
            const iBook = this.toItalic(this.r.sourceTitle);
            const book = Builder.ensureEnd(`In ${iBook}`, Punc.Comma);
            const eds = this.editorsPart;
            const range = this.articleNumberPart || this.pageRangePart || "";
            const edsRange = [eds, range].filter(x => x).join(Punc.Comma + Punc.Space);

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                book,
                Builder.ensureEnd(edsRange, Punc.Period),
                this.publishersPart);
        }

        toDegree() {
            const url = this.url ? Builder.ensureEnd(this.url, Punc.Period) : "";

            return Builder.joinPartsSpace(
                this.authorsPart,
                this.yearPart,
                this.quoteTitlePart,
                Builder.ensureEnd(this.r.degreeType, Punc.Comma),
                Builder.ensureEnd(this.r.university, Punc.Period),
                url);
        }

        /** @param {string[]} names @param {boolean} disableCommaOnTwo */
        formatNames(names, disableCommaOnTwo = false) {
            if (names.length === 0)
                return "";

            if (names.length === 1)
                return names[0];

            const firstName = names[0];
            const lastIndex = names.length - 1;
            const lastName = names[lastIndex];

            const punc = Punc.Comma + Punc.Space;
            const headPart = names.slice(0, lastIndex).join(punc);

            const tailPunc = (disableCommaOnTwo && names.length == 2) ? Punc.Space : punc;
            const tailPart = `${tailPunc}and ${lastName}`;

            return headPart + tailPart;
        }

        toForeSur(name = "") {
            if (!name.includes(","))
                return name;

            const [last, first] = name.split(",").map(x => x.trim()).slice(0, 2);
            return [first, last].join(Punc.Space);
        }
    }

    /** @type {HTMLInputElement} */
    const $jsonFileInput = document.querySelector("#jsonFileInput");
    /** @type {HTMLSelectElement} */
    const $formatSelect = document.querySelector("#formatSelect");
    /** @type {HTMLInputElement} */
    const $withDoiCheck = document.querySelector("#withDoiCheck");
    /** @type {HTMLInputElement} */
    const $filterInput = document.querySelector("#filterInput");
    /** @type {HTMLButtonElement} */
    const $selectAllButton = document.querySelector("#selectAllButton");
    /** @type {HTMLElement} */
    const $outputArea = document.querySelector("#outputArea");
    /** @type {HTMLElement} */
    const $refList = document.querySelector("#refList");
    /** @type {HTMLElement} */
    const $searchKeyList = document.querySelector("#searchKeyList");

    if (!$jsonFileInput || !$formatSelect || !$withDoiCheck || !$filterInput || !$outputArea)
        throw Error("Elements of the interface are not existed in the document.");

    /** @type {Reference[]} */
    let references = [];
    initSelect();
    registerInput();

    function initSelect() {
        const $options = [...$formatSelect.querySelectorAll('option')];
        if (!$options.length)
            return;

        const format = new URL(window.location.href).searchParams.get("format") || "";
        const map = new Map($options.map($o => [$o.value.toLowerCase(), $o]));
        const $option = map.get(format.toLowerCase()) || $options[0];
        $option.selected = true;
    }

    function loadJson(json = "") {
        references = parseJson(json);
        refresh();
    }

    function refresh() {
        display();
        registerOutput();
    }

    function registerInput() {
        registerTextFileChange($jsonFileInput, loadJson);
        $jsonFileInput.addEventListener("click", () => $jsonFileInput.value = "");
        $formatSelect.addEventListener("change", refresh);

        $filterInput.addEventListener("input", event => {
            const $divs = document.querySelectorAll("div.ref, div.info");
            const value = escapeRegexp($filterInput.value);
            const regexp = new RegExp(value, "i");

            if (!value.length)
                return showElements($divs);

            $divs.forEach(e => toggleElements(
                [e], regexp.test(e.getAttribute(DataAttr.SearchText))));
        });

        $selectAllButton.addEventListener("click", event => {
            copyElement($outputArea, true);
        });
    }

    function registerOutput() {
        document.querySelectorAll("div.ref").forEach(e => e.addEventListener("click", event => {
            copyElement(e, true);
        }));
    }

    function display() {
        const withDoi = $withDoiCheck.checked;
        const format = $formatSelect.value;

        const builder = (new Map([
            [RefFormat.Apa, ApaBuilder],
            [RefFormat.Tjs, TjsBuilder],
            [RefFormat.Chicago, ChicagoBuilder],
        ])).get(format);
        const toFormat = r => toRefElement(new builder(r, true, withDoi));

        removeDiv($outputArea);
        references.map(toFormat).forEach(e => $outputArea.appendChild(e));

        removeDiv($refList);
        references.map(toInfoElement).forEach(e => $refList.appendChild(e));

        $searchKeyList.innerText = references.map(r => r.searchKey).join("\n");
    }

    /** @param {Builder} b */
    function toRefElement(b) {
        const r = b.r;
        const $div = document.createElement("div");
        $div.setAttribute("class", "ref");
        $div.setAttribute(DataAttr.SearchText, r.searchText);
        $div.innerHTML = b.build();

        return $div;
    }

    /** @param {Reference} r */
    function toInfoElement(r) {
        const appendAnchor = (element, text, href) => {
            const $a = document.createElement("a");
            $a.innerText = text;
            $a.setAttribute("href", href);
            $a.setAttribute("target", "_blank");
            element.append($a);
        };

        const $p1 = document.createElement("p");
        $p1.append(r.searchKey);
        r.infoUrl.split(" ")
            .filter(URL.canParse)
            .map(x => new URL(x))
            .forEach(url => appendAnchor($p1, url.hostname, url.href));

        const $p2 = document.createElement("p");
        const scholarUrl = "https://scholar.google.com/scholar?q=";
        const queryUrl = scholarUrl + encodeURIComponent(r.searchText);
        appendAnchor($p2, r.title, queryUrl);

        const $div = document.createElement("div");
        $div.setAttribute("class", "info");
        $div.setAttribute(DataAttr.SearchText, r.searchText);
        $div.append($p1, $p2);

        return $div;
    }

    /** @param {HTMLElement} e */
    function removeDiv(e) {
        [...e.querySelectorAll("div")].forEach($e => $e.remove());
    }
})();
