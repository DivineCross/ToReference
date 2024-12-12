class Reference {
    static SourceType = Object.freeze({
        JournalArticle: "JournalArticle",
        Book: "Book",
        ChapterInBook: "ChapterInBook",
        ConferenceInBook: "ConferenceInBook",
        Conference: "Conference",
        Degree: "Degree",
        Database: "Database",
        Webpage: "Webpage",
        AsIs: "AsIs",
    });

    get searchText() {
        return [this.authors.join(", "), this.year, this.title].join(", ");
    }

    constructor(obj) {
        /** @type {string} */
        this.infoUrl = obj.infoUrl;
        /** @type {string} */
        this.searchKey = obj.searchKey;
        this.sourceType = obj.sourceType;
        /** @type {string[]} */
        this.authors = obj.authors || [];
        /** @type {string[]} */
        this.editors = obj.editors || [];
        /** @type {string[]} */
        this.publishers = obj.publishers || [];
        this.year = obj.year;
        this.yearSuffix = obj.yearSuffix;
        this.month = obj.month;
        this.day = obj.day;
        /** @type {Date} */
        this.dateFrom = obj.dateFrom ? new Date(obj.dateFrom) : obj.dateFrom;
        /** @type {Date} */
        this.dateTo = obj.dateTo ? new Date(obj.dateTo) : obj.dateTo;
        this.title = obj.title;
        this.sourceName = obj.sourceName;
        this.sourceTitle = obj.sourceTitle;
        this.periodical = obj.periodical;
        this.conference = obj.conference;
        this.volumeNumber = obj.volumeNumber;
        this.issueNumber = obj.issueNumber;
        /** @type {string} */
        this.edition = obj.edition;
        this.conferenceType = obj.conferenceType;
        this.city = obj.city;
        this.state = obj.state;
        this.country = obj.country;
        this.degreeType = obj.degreeType;
        this.university = obj.university;
        this.database = obj.database;
        this.articleNumber = obj.articleNumber;
        this.pageFrom = obj.pageFrom;
        this.pageTo = obj.pageTo;
        /** @type {string[]} */
        this.asIsParts = obj.asIsParts || [];
        this.url = obj.url;
    }

    static fromJson(json = "") {
        /** @type {Object[]} */
        const objects = JSON.parse(json);

        return objects.map(x => new Reference(x));
    }
}
