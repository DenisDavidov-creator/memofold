export interface DraftCard {
    
    id?: number | string
    originalWord: string
    translation: string 
    originalContext?: string 
    translationContext?: string

    sourseSetId?: number
}
