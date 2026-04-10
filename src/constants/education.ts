export const SCHOOL_LEVELS = ["10th", "+1", "+2"];

export const COLLEGE_LEVELS = [
    "UG",
    "PG",
    "Engineering",
    "Medical",
    "Diploma",
];

export const ALL_LEVELS = [...SCHOOL_LEVELS, ...COLLEGE_LEVELS];

export const BOARDS = ["State Board", "CBSE", "ICSE", "Other Board"];

export const UNIVERSITIES = [
    "MG University",
    "Kerala University",
    "Calicut University",
    "KTU",
    "CUSAT",
    "Kannur University",
    "Other University",
];

export const getInstitutionType = (level: string) => {
    if (SCHOOL_LEVELS.includes(level)) {
        return "school";
    }
    if (COLLEGE_LEVELS.includes(level)) {
        return "college";
    }
    return null;
};
