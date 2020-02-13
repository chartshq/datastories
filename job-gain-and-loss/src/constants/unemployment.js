const TOOLTIP_TEXT = {
    men: 'Men',
    women: 'Women',
    white: 'White',
    hispanic: 'Hispanic',
    black: 'Black',
    lessThanHS: 'Less Than H.S.',
    hsGrad: 'H.S. Grad',
    bachelors: 'Bachelors',
    someCollege: 'Some College',
    years16to24: '16-24 years',
    years25to34: '25-34 years',
    years35to44: '35-44 years',
    years45to54: '45-44 years',
    years55more: '55+ years',
    unemp: 'Overall'
};

const LEGEND_TEXT = {
    men: {
        active: 'Men',
        inactive: 'Women'
    },
    women: {
        active: 'Women',
        inactive: 'Men'
    },
    white: {
        active: 'White',
        inactive: 'Other race/ethnicities'
    },
    hispanic: {
        active: 'Hispanic',
        inactive: 'Other race/ethnicities'
    },
    black: {
        active: 'Black',
        inactive: 'Other race/ethnicities'
    },
    lessThanHS: {
        active: 'Less than a high school diploma (age 25+)',
        inactive: 'Other educations (age 25+)'
    },
    hsGrad: {
        active: 'High school graduates, no college (age 25+)',
        inactive: 'Other educations (age 25+)'
    },
    bachelors: {
        active: 'Bachelor\'s Degree and Higher (age 25+)',
        inactive: 'Other educations (age 25+)'
    },
    someCollege: {
        active: 'Some college or associate degree (age 25+)',
        inactive: 'Other educations (age 25+)'
    },
    years16to24: {
        active: '16-24 years',
        inactive: 'Other ages'
    },
    years25to34: {
        active: '25-34 years',
        inactive: 'Other ages'
    },
    years35to44: {
        active: '35-44 years',
        inactive: 'Other ages'
    },
    years45to54: {
        active: '45-54 years',
        inactive: 'Other ages'
    },
    years55more: {
        active: '55 years and older',
        inactive: 'Other ages'
    }
};

const TITLE_TEXT = {
    men: 'by gender',
    women: 'by gender',
    white: 'by Race/Ethnicity',
    hispanic: 'by Race/Ethnicity',
    black: 'by Race/Ethnicity',
    lessThanHS: 'by education',
    hsGrad: 'by education',
    bachelors: 'by education',
    someCollege: 'by education',
    years16to24: 'by age',
    years25to34: 'by age',
    years35to44: 'by age',
    years45to54: 'by age',
    years55more: 'by age',
    unemp: ', overall'
};

const TITLE_DESCRIPTION = {
    lessThanHS: 'less than a high school diploma',
    hsGrad: 'high school graduates, no college',
    bachelors: 'bachelor\'s degree and higher',
    someCollege: 'some college or associate degree',
    white: 'whites',
    hispanic: 'hispanics',
    black: 'blacks'
};
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
const MONTHS_ARR = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.',
    'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const DATE_TOOLTIP_MAP = {
    1950: '1950',
    1960: '\'60',
    1970: '\'70',
    1980: '\'80',
    1990: '\'90',
    2000: '2000',
    2010: '\'10'
};

module.exports = {
    TOOLTIP_TEXT,
    LEGEND_TEXT,
    TITLE_TEXT,
    TITLE_DESCRIPTION,
    FULL_MONTH_NAMES,
    MONTHS_ARR,
    DATE_TOOLTIP_MAP
};
