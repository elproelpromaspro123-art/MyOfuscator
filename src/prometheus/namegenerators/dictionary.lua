-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- namegenerators/dictionary.lua
--
-- This Script provides a function for generation of plausible identifier names that look like real code

local util = require("prometheus.util");

local prefixes = {
    "get", "set", "is", "has", "can", "do", "on", "handle", "create", "update",
    "delete", "remove", "add", "insert", "find", "search", "load", "save", "init",
    "parse", "validate", "check", "process", "build", "make", "render", "fetch",
    "send", "receive", "read", "write", "open", "close", "start", "stop", "run",
    "execute", "call", "invoke", "apply", "trigger", "emit", "fire", "dispatch",
}

local nouns = {
    "Data", "Value", "Result", "Item", "Element", "Node", "Entry", "Record",
    "Object", "Entity", "Model", "View", "Controller", "Handler", "Manager",
    "Service", "Provider", "Factory", "Builder", "Parser", "Loader", "Writer",
    "Reader", "Stream", "Buffer", "Cache", "Store", "State", "Context", "Config",
    "Options", "Settings", "Params", "Args", "Input", "Output", "Response",
    "Request", "Message", "Event", "Action", "Task", "Job", "Worker", "Thread",
    "Process", "Instance", "Component", "Module", "Plugin", "Extension", "Util",
    "Helper", "Tool", "Index", "Count", "Size", "Length", "Width", "Height",
    "Position", "Location", "Point", "Offset", "Margin", "Padding", "Border",
}

local simpleNames = {
    "value", "data", "result", "item", "node", "temp", "tmp", "val", "obj",
    "arr", "list", "map", "set", "key", "idx", "i", "j", "k", "n", "x", "y", "z",
    "a", "b", "c", "str", "num", "len", "count", "index", "flag", "status",
    "name", "type", "id", "ref", "ptr", "src", "dst", "buf", "ctx", "cfg",
    "err", "msg", "ret", "res", "req", "rsp", "cb", "fn", "func", "handler",
    "callback", "listener", "observer", "delegate", "target", "source", "dest",
    "parent", "child", "root", "head", "tail", "prev", "next", "current", "last",
    "first", "begin", "end", "start", "stop", "min", "max", "sum", "avg", "total",
}

local function generateName(id, scope)
    local totalSimple = #simpleNames
    local totalCompound = #prefixes * #nouns
    local totalNames = totalSimple + totalCompound
    
    local d = id % totalNames
    id = (id - d) / totalNames
    
    local name
    if d < totalSimple then
        name = simpleNames[d + 1]
    else
        local compoundId = d - totalSimple
        local prefixIdx = compoundId % #prefixes
        local nounIdx = (compoundId - prefixIdx) / #prefixes
        name = prefixes[prefixIdx + 1] .. nouns[nounIdx + 1]
    end
    
    if id > 0 then
        name = name .. tostring(id)
    end
    
    return name
end

local function prepare(ast)
    util.shuffle(prefixes);
    util.shuffle(nouns);
    util.shuffle(simpleNames);
end

return {
	generateName = generateName, 
	prepare = prepare
};
