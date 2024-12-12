class Helper {
}

Helper.Alphabetical = (() => {
    class Alphabetical {
    }

    Alphabetical.compare = (s1 = "", s2 = "") => {
        const CharOrderMap = (() => {
            const order = [
                "0123456789",
                `!"#$%&'()*+,-./`,
                "AÀÁÂÃÄÅĀĂĄ",
                "aàáâãäåāăą",
                "BɃƁƂ",
                "bƀɓƃ",
                "CÇĆĈĊČƇ",
                "cçćĉċčƈ",
                "DĎĐƊƋ",
                "dďđɗƌ",
                "EÈÉÊËĒĔĖĘĚ",
                "eèéêëēĕėęě",
                "FƑ",
                "fƒ",
                "GĜĞĠĢƓ",
                "gĝğġģɠ",
                "HĤĦ",
                "hĥħ",
                "IÌÍÎÏĨĪĬĮİƗȽ",
                "iìíîïĩīĭįıɨƚ",
                "JĴ",
                "jĵ",
                "KĶƘ",
                "kķƙ",
                "LĹĻĽĿŁ",
                "lĺļľŀł",
                "M",
                "m",
                "NÑŃŅŇƝȠ",
                "nñńņňɲƞ",
                "OÒÓÔÕÖØŌŎŐƟƠ",
                "oòóôõöøōŏőɵơ",
                "PƤ",
                "pƥ",
                "Q",
                "q",
                "RŔŖŘ",
                "rŕŗř",
                "SŚŜŞŠ",
                "sśŝşš",
                "TŢŤŦƬƮ",
                "tţťŧƫƭʈ",
                "UÙÚÛÜŨŪŬŮŰŲƯ",
                "uùúûüũūŭůűųư",
                "VƲ",
                "vʋ",
                "WŴ",
                "wŵ",
                "X",
                "x",
                "YÝŸŶƳ",
                "yýÿŷƴ",
                "ZŹŻŽƵ",
                "zźżžƶ",
                "ÆæĲĳŒœ",
                "ÐðÞþßĸŊŋſ",
                "ƄƅƆƉƍƎƏƐƔƕƖƛƜƢƣƦƧƨƩƪƱƷƸƹƺƻƼƽƾƿ",
            ].join("");

            const map = new Map;
            for (let i = 0; i < order.length; ++i)
                map.set(order[i], i);

            return map;
        })();

        const compareChar = (c1 = "", c2 = "") => {
            const o1 = CharOrderMap.get(c1);
            const o2 = CharOrderMap.get(c2);

            return (o1 === undefined || o2 === undefined)
                ? c1.charCodeAt(0) - c2.charCodeAt(0)
                : o1 - o2;
        };

        const ignoreRegex = /[ ()（）,;\-\.]/g;
        const a = s1.replace(ignoreRegex, "");
        const b = s2.replace(ignoreRegex, "");

        let r = 0;
        for (let i = 0; i < Math.min(a.length, b.length); ++i)
            if ((r = compareChar(a[i], b[i])) !== 0)
                return r;

        return a.length - b.length;
    };

    return Alphabetical;
})();

Helper.Dom = (() => {
    class Dom {
    }

    /**
     * @param {HTMLInputElement} element
     * @param {(text: string) => void} textHandler
     */
    Dom.registerTextFileChange = (element, textHandler) => {
        element.addEventListener("change", event => {
            const file = element.files[0];

            if (!file)
                return;

            const reader = new FileReader();
            reader.readAsText(file);
            reader.addEventListener("load", () => {
                textHandler(reader.result);
            });
        });
    };

    /**
     * @param {HTMLElement} element
     * @param {boolean} keepSelect
     */
    Dom.copyElement = (element, keepSelect = false) => {
        const range = document.createRange();
        range.selectNodeContents(element);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        element.focus();
        document.execCommand("copy");

        if (!keepSelect)
            selection.removeAllRanges();
    }

    /**
     * @param {HTMLElement[]} es
     * @param {boolean} test
     */
    Dom.toggleElements = (es, test) => {
        return test ? Dom.showElements(es) : Dom.hideElements(es);
    };

    /** @param {HTMLElement[]} es */
    Dom.showElements = es => {
        es.forEach(e => e.style.display = "block");
    };

    /** @param {HTMLElement[]} es */
    Dom.hideElements = es => {
        es.forEach(e => e.style.display = "none");
    };

    return Dom;
})();

Helper.Regexp = (() => {
    class Regexp {
    }

    const Regex = Object.freeze({
        Escape: /[.*+?^${}()|[\]\\]/g,
        EscapeTo: "\\$&",
    });

    Regexp.escape = (s = "") => {
        return s.replace(Regex.Escape, Regex.EscapeTo);
    }

    return Regexp;
})();
