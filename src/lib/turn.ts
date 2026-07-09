

export function isRealUserTurn(body: any): boolean {

    if (!body || typeof body !== "object") return false;

    // return false if it's not a number, or if it's <= your floor (~16).
    const floor: number = 16;
    if (typeof body.max_tokens !== "number" || body.max_tokens <= floor) return false;
  

    // body.messages must be a non-empty array. get last element.
    const lastElement = body.messages[body.messages.length - 1];
    if (!Array.isArray(body.messages) || body.messages.length === 0) return false;

    if (lastElement.role !== "user") return false;

    // flatten array to string and check for system prompts
    const flat = flattenSystem(body.system)
    if (!flat.includes("You are Claude Code")) return false;
 
    // all tests pass
    return true;
}

// given the system (array | string | undefined), return one plain string.
function flattenSystem(system: any): string {
  if (typeof system === "string") return system;
  if (Array.isArray(system)) {

    const str: string = system.map(item => item.text).join("\n")
    return str;
  }
  return "";
}