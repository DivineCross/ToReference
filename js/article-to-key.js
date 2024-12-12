/// <reference path="helper.js" />

(() => {
    const compareKey = Helper.Alphabetical.compare;
    const copyElement = Helper.Dom.copyElement;
    const registerTextFileChange = Helper.Dom.registerTextFileChange;

    /** @type {HTMLTextAreaElement}*/
    const $article = document.querySelector("#article");
    /** @type {HTMLElement} */
    const $copy = document.querySelector("#copy");
    /** @type {HTMLElement} */
    const $keyList = document.querySelector("#keyList");

    if (!$article || !$keyList)
        throw Error("Elements of the interface are not existed in the document.");

    registerTextFileChange($article, text => {
        $keyList.innerText = parseKeys(text);
    });

    $copy.addEventListener("click", event => {
        copyElement($keyList);
    });

    function parseKeys(article = "") {
        const inText = article.replace(/((.|\n)+)參考文獻(.|\n)+/, "$1");
        const regexp = /(（([^）]|\n)*[,;；][\s\n]*\d{4}[a-z]?）)|(([a-zA-ZÀ-῿][a-zA-ZÀ-῿&,\.\s\n]*（\d{4}[a-z]?）(,\s*)?)+)/g;
        const matches = inText.match(regexp);

        const citations = matches.flatMap(m => m
            .replace(/[;；]/gm, ";")
            .replace(/^（(.*)）$/gm, "$1")
            .replace(/(;\s*)(?!\s*\d)/gm, "\n")
            .replace(/(?<=\d{4}[a-z]?)[,; ]+(\d{4}[a-z]?)/gm, "\n$1 $`")
            .replace(/^(\d{4}[a-z]?)\s*([^\d]+).*$/gm, "$2$1")
            .replace(/,\s*(\d{4}[a-z]?)$/gm, "（$1）")
            .split("\n"));

        const regexpC = /(（[一-鿿]+，\d{4}）)|([一-鿿]{2,3}（\d{4}）)/g;
        const matchesC = inText.match(regexpC);

        const citationsC = matchesC.map(m => {
            const name = m.match(/[一-鿿]+/)[0];
            const year = m.match(/\d{4}/)[0];
            return `${name}（${year}）`;
        });

        const allCitations = citations.concat(citationsC);
        const lines = Array.from(new Set(allCitations)).sort(compareKey).join("\n");

        return lines;
    }
})();
