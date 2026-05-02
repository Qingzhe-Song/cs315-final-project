import type { QueryDefinition } from '@/types';

// catalog metadata drives preset forms, descriptions, and chart choices.
export const queryCatalog: QueryDefinition[] = [
    // query 1 compares genre recommendation rates after a release year cutoff.
    {
        id: 'q1',
        number: 1,
        title: 'Top Genres After 2020',
        summary: 'Which genres have the highest average recommendation rate among games released after 2020?',
        inputs: [
            { name: 'min_release_year', label: 'Earliest Release Year', type: 'number', default: 2021 },
            { name: 'min_reviews', label: 'Minimum Reviews per Genre', type: 'number', default: 10 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 15 },
        ],
        chart: {
            type: 'bar',
            labelColumns: ['GenreName'],
            valueColumns: ['AvgRecommendationPct'],
            indexAxis: 'y',
        },
    },
    // query 2 finds publishers with many highly reviewed games.
    {
        id: 'q2',
        number: 2,
        title: 'High-Performing Publishers',
        summary: 'Which publishers have released the largest number of games that have both high recommendation rates and high review counts?',
        inputs: [
            { name: 'min_reviews', label: 'Minimum Reviews per Game', type: 'number', default: 10000 },
            { name: 'min_recommendation_pct', label: 'Minimum Recommendation %', type: 'number', default: 80 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 15 },
        ],
        chart: {
            type: 'bar',
            labelColumns: ['PublisherName'],
            valueColumns: ['NumHighPerformingGames'],
            indexAxis: 'y',
        },
    },
    // query 3 tracks the strongest genre per release year.
    {
        id: 'q3',
        number: 3,
        title: 'Best Genre by Release Year',
        summary: 'For each release year, which genre had the highest average review count per game?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 30 }],
        chart: {
            type: 'line',
            labelColumns: ['YearReleased', 'GenreName'],
            valueColumns: ['AvgReviewsPerGame'],
        },
    },
    // query 4 highlights games with high popularity but weaker sentiment.
    {
        id: 'q4',
        number: 4,
        title: 'Popular but Below Average Sentiment',
        summary: 'Which games have unusually high review counts despite having below-average recommendation rates compared with other games released in the same year?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 20 }],
        chart: {
            type: 'scatter',
            labelColumns: ['Title'],
            xColumn: 'RecommendationPct',
            yColumn: 'ReviewCount',
        },
    },
    // query 5 compares developer consistency across multiple genres.
    {
        id: 'q5',
        number: 5,
        title: 'Cross-Genre Developer Consistency',
        summary: 'Which developers consistently produce games with high recommendation rates across multiple genres?',
        inputs: [
            { name: 'min_genres', label: 'Minimum Genres', type: 'number', default: 2 },
            { name: 'min_games', label: 'Minimum Games', type: 'number', default: 2 },
            { name: 'min_reviews', label: 'Minimum Reviews', type: 'number', default: 20 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 20 },
        ],
        chart: {
            type: 'bubble',
            labelColumns: ['DeveloperName'],
            xColumn: 'NumGenres',
            yColumn: 'AvgRecommendationPct',
            radiusColumn: 'NumGames',
        },
    },
    // query 6 compares review activity across price bands and genres.
    {
        id: 'q6',
        number: 6,
        title: 'Price vs Popularity by Genre',
        summary: 'How does price relate to popularity within each genre?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 30 }],
        chart: {
            type: 'bar',
            xColumn: 'PriceRange',
            yColumn: 'AvgReviewsPerGame',
            seriesColumn: 'GenreName',
            categoryOrder: ['Free', 'Under $10', '$10-$29.99', '$30-$59.99', '$60+'],
        },
    },
    // query 7 visualizes genre growth over release years.
    {
        id: 'q7',
        number: 7,
        title: 'Genre Growth Over Time',
        summary: 'Which genres show the strongest growth in both released games and review activity over time?',
        inputs: [
            { name: 'genre_keyword', label: 'Optional Genre Keyword', type: 'text', default: '' },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 40 },
        ],
        chart: {
            type: 'line',
            xColumn: 'ReleaseYear',
            yColumn: 'TotalReviews',
            seriesColumn: 'GenreName',
        },
    },
    // query 8 looks at engagement patterns for multiplayer-related tags.
    {
        id: 'q8',
        number: 8,
        title: 'Multiplayer Engagement Tags',
        summary: 'Among multiplayer-supported games, which tags are associated with the highest user engagement?',
        inputs: [
            { name: 'min_reviews', label: 'Minimum Reviews per Tag', type: 'number', default: 10 },
            { name: 'feature_keyword', label: 'Feature Keyword', type: 'text', default: 'multi' },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 20 },
        ],
        chart: {
            type: 'bubble',
            labelColumns: ['TagName'],
            xColumn: 'AvgHoursPlayed',
            yColumn: 'AvgHelpfulVotes',
            radiusColumn: 'NumReviews',
        },
    },
    // query 9 charts games where popularity and sentiment diverge.
    {
        id: 'q9',
        number: 9,
        title: 'Popularity vs Sentiment Mismatch',
        summary: 'Which games have the greatest mismatch between popularity and sentiment?',
        inputs: [
            { name: 'min_reviews', label: 'Minimum Reviews per Game', type: 'number', default: 20 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 20 },
        ],
        chart: {
            type: 'bubble',
            labelColumns: ['Title'],
            xColumn: 'RecommendationPct',
            yColumn: 'ReviewCount',
            radiusColumn: 'MismatchScore',
        },
    },
    // query 10 aggregates popular-game performance by publisher.
    {
        id: 'q10',
        number: 10,
        title: 'Popular Publishers',
        summary: 'Which publishers release the largest number of popular games?',
        inputs: [
            { name: 'min_reviews', label: 'Minimum Reviews per Game', type: 'number', default: 20 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 20 },
        ],
        chart: {
            type: 'bubble',
            labelColumns: ['PublisherName'],
            xColumn: 'NumPopularGames',
            yColumn: 'AvgRecommendationPct',
            radiusColumn: 'AvgReviewsPerGame',
        },
    },
    // query 11 compares review activity for games on multiple platforms.
    {
        id: 'q11',
        number: 11,
        title: 'Multi-Platform Review Activity',
        summary: 'For games that support multiple operating systems, how does review activity differ?',
        inputs: [
            { name: 'min_platforms', label: 'Minimum Supported Platforms', type: 'number', default: 2 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 20 },
        ],
        chart: {
            type: 'bubble',
            labelColumns: ['Title'],
            xColumn: 'NumPlatforms',
            yColumn: 'ReviewCount',
            radiusColumn: 'RecommendationPct',
        },
    },
    // query 12 summarizes common traits among the top-reviewed games.
    {
        id: 'q12',
        number: 12,
        title: 'Traits of Top-Reviewed Games',
        summary: 'What characteristics are most common among the top-reviewed games?',
        inputs: [
            { name: 'top_limit', label: 'How Many Top-Reviewed Games', type: 'number', default: 50 },
            { name: 'limit', label: 'Rows to Show', type: 'number', default: 25 },
        ],
        chart: {
            type: 'doughnut',
            labelColumns: ['GenreName', 'PriceRange'],
            valueColumns: ['NumTopGames'],
        },
    },
    // query 13 compares release months by reviews and recommendation rate.
    {
        id: 'q13',
        number: 13,
        title: 'Best Release Months',
        summary: 'Which release months are associated with the highest average review counts and recommendation rates?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 12 }],
        chart: {
            type: 'line',
            labelColumns: ['ReleaseMonth'],
            valueColumns: ['AvgReviewsPerGame', 'AvgRecommendationPct'],
            categoryOrder: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            rightAxisColumns: ['AvgRecommendationPct'],
        },
    },
    // query 14 finds large review-count gaps within year and genre groups.
    {
        id: 'q14',
        number: 14,
        title: 'Largest Review-Count Gaps',
        summary: 'Which games released in the same year and genre show the largest differences in review count?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 50 }],
        chart: {
            type: 'bar',
            labelColumns: ['ReleaseYear', 'GenreName', 'MoreReviewedGame', 'LessReviewedGame'],
            valueColumns: ['ReviewCountGap'],
            indexAxis: 'y',
        },
    },
    // query 15 compares feature performance using bubble chart dimensions.
    {
        id: 'q15',
        number: 15,
        title: 'Top Features by Performance',
        summary: 'Which features are associated with the highest average recommendation rates and review counts?',
        inputs: [{ name: 'limit', label: 'Rows to Show', type: 'number', default: 20 }],
        chart: {
            type: 'bubble',
            labelColumns: ['FeatureName'],
            xColumn: 'AvgRecommendationPct',
            yColumn: 'AvgReviewCount',
            radiusColumn: 'NumGames',
        },
    },
];
