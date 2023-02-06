/**
 * Formats a patient name for display purposes
 */
export default function formatPN(name) {
    if (!name) {
        return;
    }

    //if (typeof (name) === "object") {
    //    return;
    //}

    // Convert the first ^ to a ', '. String.replace() only affects
    // the first appearance of the character.
    const commaBetweenFirstAndLast = name.replace('^', ', ');

    // Replace any remaining '^' characters with spaces
    const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

    // Trim any extraneous whitespace
    return cleaned.trim();
}
