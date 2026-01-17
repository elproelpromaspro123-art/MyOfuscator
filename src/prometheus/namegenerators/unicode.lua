-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- namegenerators/unicode.lua
--
-- This Script provides a function for generation of names using unicode characters
-- that look like ASCII but aren't (Cyrillic, Greek, etc.)
-- Note: Lua 5.3+ supports UTF-8 identifiers, but compatibility may vary

local util = require("prometheus.util");

local MIN_CHARACTERS = 4;
local MAX_INITIAL_CHARACTERS = 8;

local offset = 0;

local unicodeChars = {
    "\xD0\xB0", -- а (Cyrillic a)
    "\xD1\x81", -- с (Cyrillic c)
    "\xD0\xB5", -- е (Cyrillic e)
    "\xD0\xBE", -- о (Cyrillic o)
    "\xD1\x80", -- р (Cyrillic p)
    "\xD1\x85", -- х (Cyrillic x)
    "\xD1\x83", -- у (Cyrillic y)
    "\xD0\x90", -- А (Cyrillic A)
    "\xD0\x92", -- В (Cyrillic B)
    "\xD0\x95", -- Е (Cyrillic E)
    "\xD0\x9A", -- К (Cyrillic K)
    "\xD0\x9C", -- М (Cyrillic M)
    "\xD0\x9D", -- Н (Cyrillic H)
    "\xD0\x9E", -- О (Cyrillic O)
    "\xD0\xA0", -- Р (Cyrillic P)
    "\xD0\xA1", -- С (Cyrillic C)
    "\xD0\xA2", -- Т (Cyrillic T)
    "\xD0\xA5", -- Х (Cyrillic X)
    "\xCE\xB1", -- α (Greek alpha)
    "\xCE\xBF", -- ο (Greek omicron)
    "\xCE\xB5", -- ε (Greek epsilon)
    "\xCE\x91", -- Α (Greek Alpha)
    "\xCE\x92", -- Β (Greek Beta)
    "\xCE\x95", -- Ε (Greek Epsilon)
    "\xCE\x97", -- Η (Greek Eta)
    "\xCE\x99", -- Ι (Greek Iota)
    "\xCE\x9A", -- Κ (Greek Kappa)
    "\xCE\x9C", -- Μ (Greek Mu)
    "\xCE\x9D", -- Ν (Greek Nu)
    "\xCE\x9F", -- Ο (Greek Omicron)
    "\xCE\xA1", -- Ρ (Greek Rho)
    "\xCE\xA4", -- Τ (Greek Tau)
    "\xCE\xA7", -- Χ (Greek Chi)
}

local startChars = {
    "\xD0\xB0", -- а (Cyrillic a)
    "\xD1\x81", -- с (Cyrillic c)
    "\xD0\xB5", -- е (Cyrillic e)
    "\xD0\xBE", -- о (Cyrillic o)
    "\xD1\x80", -- р (Cyrillic p)
    "\xD1\x85", -- х (Cyrillic x)
    "\xD0\x90", -- А (Cyrillic A)
    "\xD0\x92", -- В (Cyrillic B)
    "\xD0\x95", -- Е (Cyrillic E)
    "\xD0\x9A", -- К (Cyrillic K)
    "\xD0\x9C", -- М (Cyrillic M)
    "\xD0\x9D", -- Н (Cyrillic H)
    "\xD0\x9E", -- О (Cyrillic O)
    "\xD0\xA0", -- Р (Cyrillic P)
    "\xCE\x91", -- Α (Greek Alpha)
    "\xCE\x92", -- Β (Greek Beta)
    "\xCE\x95", -- Ε (Greek Epsilon)
    "\xCE\x99", -- Ι (Greek Iota)
    "\xCE\x9A", -- Κ (Greek Kappa)
    "\xCE\x9C", -- Μ (Greek Mu)
    "\xCE\x9D", -- Ν (Greek Nu)
    "\xCE\x9F", -- Ο (Greek Omicron)
}

local function generateName(id, scope)
	local name = ''
	id = id + offset;
	local d = id % #startChars
	id = (id - d) / #startChars
	name = name..startChars[d+1]
	while id > 0 do
		local d = id % #unicodeChars
		id = (id - d) / #unicodeChars
		name = name..unicodeChars[d+1]
	end
	return name
end

local function prepare(ast)
	util.shuffle(unicodeChars);
	util.shuffle(startChars);
	offset = math.random(#unicodeChars ^ MIN_CHARACTERS, #unicodeChars ^ MAX_INITIAL_CHARACTERS);
end

return {
	generateName = generateName, 
	prepare = prepare
};
