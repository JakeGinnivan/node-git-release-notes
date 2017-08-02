export const getReleaseDate = () => {
    const date = new Date()
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}
