export const extractPlatformDataFromBrowser = async (tabId) => {
    const [{ result } = {}] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            const serialize = element => ({
                children: Array.from(element.children, serialize)
            })

            return document.body ? serialize(document.body) : null
        }
    })

    return result
}
