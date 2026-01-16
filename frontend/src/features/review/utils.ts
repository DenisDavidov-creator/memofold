export const checkAnswer = (input: string, correct:string):boolean => {
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    return normalize(input) === normalize(correct)
}