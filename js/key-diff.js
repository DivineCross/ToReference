/// <reference path="helper.js" />
/// <reference path="reference.js" />

(() => {
    const registerTextFileChange = Helper.Dom.registerTextFileChange;
    const copyElement = Helper.Dom.copyElement;
    const escapeRegexp = Helper.Regexp.escape;
    const parseJson = Reference.fromJson;

    const Delimiter = Object.freeze({
        To: "=>",
    });

    /** @type {HTMLInputElement} */
    const $jsonFile = document.querySelector("#jsonFile");
    /** @type {HTMLInputElement} */
    const $textFile = document.querySelector("#textFile");

    /** @type {HTMLButtonElement} */
    const $download = document.querySelector("#download");
    /** @type {HTMLButtonElement} */
    const $downloadDiff = document.querySelector("#downloadDiff");

    /** @type {HTMLElement} */
    const $diffTable = document.querySelector("#diffTable");
    /** @type {HTMLElement} */
    const $unmatchedList = document.querySelector("#unmatchedList");

    let keyFileText = "";
    let refFileText = "";
    registerTextFileChange($textFile, s => { keyFileText = s; ready(); });
    registerTextFileChange($jsonFile, s => { refFileText = s; ready(); });

    function ready() {
        if (!keyFileText || !refFileText)
            return;

        display();
        register();
    }

    function display() {
        const references = parseJson(refFileText);
        const refMap = new Map(references.map(r => [
            r.authors.concat(r.year + (r.yearSuffix || "")).join(" "),
            r.searchText,
        ]));
        const matchedRefs = new Set;

        const getRef = (k = "") => {
            const toRegexp = x => new RegExp(`(?<!\\w)${x}(?!\\w)`);
            const pureK = k
                .replace(/\[\d+\]/g, " ")
                .replace(/,/g, " ")
                .replace(/&/g, " ")
                .replace(/\band\b/gi, " ")
                .replace(/\bet al\./gi, " ");

            const ks = escapeRegexp(pureK).split(" ").filter(x => x);
            for (const refKey of refMap.keys())
                if (ks.reduce((a, c) => a && toRegexp(c).test(refKey), true))
                    return refMap.get(refKey);
        };

        const addRow = (key1 = "", key2 = "", ref = "") => {
            const $key1 = createElement("td", key1, "key1")
            const $key2 = createElement("td", key2 || "", "key2")
            const $ref = createElement("td", ref, "ref " + (ref ? "" : "warning"));
            if (!ref)
                $key2.setAttribute("contenteditable", "plaintext-only");

            const $row = createElement("tr", "");
            $row.append($key1, $key2, $ref);

            $diffTable.append($row);
        };

        const keyLines = keyFileText.split("\n").map(x => x.trim()).filter(x => x);
        const keyRows = keyLines.filter(x => !x.startsWith('#'));
        keyRows.forEach(row => {
            const [key1, key2] = row.split(Delimiter.To).map(x => x.trim());
            const ref = getRef(key1);

            addRow(key1, key2, ref);
            matchedRefs.add(ref);
        });

        const unmatchedRefs = [...refMap.values()].filter(r => !matchedRefs.has(r));
        unmatchedRefs.forEach(r => $unmatchedList.append(createElement('div', r)));
    }

    function register() {
        $download.addEventListener("click", _ => download(false));
        $downloadDiff.addEventListener("click", _ => download(true));
    }

    function download(diffOnly = false) {
        const text = toDiffFileText(diffOnly);
        const blob = new Blob([text], { type: 'text/plain' });

        const $a = document.createElement('a');
        $a.setAttribute('download', 'key-diff.txt');
        $a.href = URL.createObjectURL(blob);

        document.body.appendChild($a);
        $a.click();
        $a.remove();
    }

    function toDiffFileText(diffOnly = false) {
        const comments = keyFileText.split("\n").filter(x => x.trim().startsWith('#'));

        /** @param {HTMLElement} $row */
        const rowToLine = $row => {
            const $tds = $row.querySelectorAll(':scope > td');

            const key1 = $tds[0].textContent.trim();
            const key2 = $tds[1].textContent.trim();
            const line = [key1, key2].filter(x => x).join(` ${Delimiter.To} `);

            return (diffOnly && (!key2 || key1 === key2)) ? "" : line;
        };

        const $trs = [...$diffTable.querySelectorAll(':scope > tr')];
        const lines = $trs.map(rowToLine).filter(x => x);

        return fileText = comments.concat("").concat(lines).join("\n");
    }

    /** @param {string} name @param {string} text @param {string} classAttr @returns {HTMLElement} */
    function createElement(name, text, classAttr) {
        const $e = document.createElement(name);
        $e.innerText = text;
        if (classAttr)
            $e.setAttribute("class", classAttr);

        return $e;
    }
})();
