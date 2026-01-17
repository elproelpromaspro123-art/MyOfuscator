-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- namegenerators/homoglyph.lua
--
-- This Script provides a function for generation of names using confusable characters (homoglyphs)

local util = require("prometheus.util");
local chararray = util.chararray;

local MIN_CHARACTERS = 4;
local MAX_INITIAL_CHARACTERS = 8;

local offset = 0;

local VarDigits = chararray("lI1iLoO0QDdCcGgKkPpSsUuVvWwXxYyZz");
local VarStartDigits = chararray("lIiLoOQDdCcGgKkPpSsUuVvWwXxYyZz");

local function generateName(id, scope)
	local name = ''
	id = id + offset;
	local d = id % #VarStartDigits
	id = (id - d) / #VarStartDigits
	name = name..VarStartDigits[d+1]
	while id > 0 do
		local d = id % #VarDigits
		id = (id - d) / #VarDigits
		name = name..VarDigits[d+1]
	end
	return name
end

local function prepare(ast)
	util.shuffle(VarDigits);
	util.shuffle(VarStartDigits);
	offset = math.random(#VarDigits ^ MIN_CHARACTERS, #VarDigits ^ MAX_INITIAL_CHARACTERS);
end

return {
	generateName = generateName, 
	prepare = prepare
};
