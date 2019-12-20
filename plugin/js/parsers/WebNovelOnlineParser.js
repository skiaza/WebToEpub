"use strict";

parserFactory.register("webnovelonline.com", () => new WebNovelOnlineParser());

class WebNovelOnlineParser extends Parser{
    constructor() {
        super();
    }

    getChapterUrls(dom) {
        let chapters = [...dom.querySelectorAll("div.chapter-list a")]
            .map(a => util.hyperLinkToChapter(a))
        return Promise.resolve(chapters.reverse());
    };

    findContent(dom) {
        return Parser.findConstrutedContent(dom);
    };

    extractTitleImpl(dom) {
        return dom.querySelector("div.novel-dexc h1");
    };

    extractAuthor(dom) {
        let authorLabel = dom.querySelector("div.novel-desc > div.info > p:nth-child(1) > span:nth-child(2)");
        return (authorLabel === null) ? super.extractAuthor(dom) : authorLabel.textContent;
    };

    findCoverImageUrl(dom) {
        return util.getFirstImgSrc(dom, "div.book");
    }

    async fetchChapter(url) {
        let xhr = await HttpClient.wrapFetch(url);
        return WebNovelOnlineParser.buildContentHtml(xhr.responseXML);
    }
 
    static buildContentHtml(dom) {
        let newDoc = Parser.makeEmptyDocForContent();
        newDoc.content.appendChild(dom.querySelector("div.chapter-info h3"));
        let paragraphs = WebNovelOnlineParser.getStringWithContent(dom)
            .split("\n")
            .filter(p => (p !== null) && (0 < p.length));
        for (let text of paragraphs) {
            let p = newDoc.dom.createElement("p");
            p.appendChild(newDoc.dom.createTextNode(text))
            newDoc.content.appendChild(p);
        }
        return newDoc.dom;
    }

    static getStringWithContent(dom) {
        let script = [...dom.querySelectorAll("script")]
            .map(s => s.textContent)
            .filter(t => t.includes("window._INITIAL_DATA_"));
        let index = script[0].indexOf("[");
        let json = script[0].substring(index,  script[0].length - 1);
        let content = JSON.parse(json)
            .filter(o => (o != null) && (o.chapter !== undefined));
        return content[0].chapter; 
    }

    getInformationEpubItemChildNodes(dom) {
        return [...dom.querySelectorAll("div.novel-desc, div.summary")];
    }

    cleanInformationNode(node) {
        util.removeChildElementsMatchingCss(node, "div.action");
    }
}
