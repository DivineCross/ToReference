/// <reference path="helper.js" />

(() => {
    const registerTextFileChange = Helper.Dom.registerTextFileChange;
    const copyElement = Helper.Dom.copyElement;
    const toggleElements = Helper.Dom.toggleElements;
    const showElements = Helper.Dom.showElements;
    const escapeRegexp = Helper.Regexp.escape;

    /** @type {HTMLInputElement} */
    const $jsonFileInput = document.querySelector("#jsonFileInput");
    /** @type {HTMLInputElement} */
    const $filterInput = document.querySelector("#filterInput");
    /** @type {HTMLElement} */
    const $outputArea = document.querySelector("#outputArea");

    registerTextFileChange($jsonFileInput, display);

    function display(text = "") {
        const lines = text.split("\n").filter(x => x);

        toOutput(lines);
        registerEvents();
    }

    /** @param {string[]} lines */
    function toOutput(lines = []) {
        const appendP = s => {
            const $e = document.createElement('p');
            $e.innerText = s;
            $outputArea.appendChild($e);
        };

        const appendH = s => {
            const $e = document.createElement('h4');
            $e.innerText = s;
            $outputArea.appendChild($e);
        };

        lines.forEach(s => {
            if (!s.startsWith("#"))
                appendP(s);
            else
                appendH(s);
        });
    }

    function registerEvents() {
        $filterInput.addEventListener("input", event => {
            const $es = document.querySelectorAll("#outputArea > p");
            const value = escapeRegexp($filterInput.value);
            const testText = text =>
                value.split(" ").reduce((a, c) => {
                    return a && new RegExp(c, "i").test(text);
                }, true);

            if (!value.length)
                return showElements($es);

            $es.forEach(e => toggleElements([e], testText(e.textContent)));
        });

        $filterInput.previousElementSibling.addEventListener("click", event => {
            navigator.clipboard.writeText($filterInput.value);
        });

        document.querySelectorAll("#outputArea > p")
            .forEach(e => e.addEventListener("click", event => {
                copyElement(e, true);
            }));
    }
})();
