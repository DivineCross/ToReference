/// <reference path="helper.js" />
/// <reference path="reference.js" />

(() => {
    const compareKey = Helper.Alphabetical.compare;
    const registerTextFileChange = Helper.Dom.registerTextFileChange;
    const parseJson = Reference.fromJson;

    /** @type {HTMLInputElement}*/
    const $jsonFileInput = document.querySelector("#jsonFileInput");
    /** @type {HTMLElement} */
    const $orderedJson = document.querySelector("#orderedJson");

    if (!$jsonFileInput || !$orderedJson)
        throw Error("Elements of the interface are not existed in the document.");

    registerTextFileChange($jsonFileInput, orderJson);

    function orderJson(json = "") {
        const references = parseJson(json);

        for (let r of references) {
            r.searchKey = r.searchKey
                .replace(/[;；]/gm, ";")
                .replace(/^（(.*)）$/gm, "$1")
                .replace(/,\s*(\d{4}[a-z]?)$/gm, "（$1）");
        }

        references.sort((r1, r2) => compareKey(r1.searchKey, r2.searchKey));

        $orderedJson.innerText = JSON.stringify(references, null, 4);
    }
})();
