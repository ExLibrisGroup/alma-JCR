export class JCIRecord {
    title: string;
    ID: string;
    available: boolean;
    year?: number;
    jci?: number;
    categoryDataArray?: CategoryData[];
}

type CategoryData = {
    
    category: string;
    rank: string;
    quartile: string;
}

export const OKstatus = "OK";