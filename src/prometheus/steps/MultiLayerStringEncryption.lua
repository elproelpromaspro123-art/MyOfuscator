-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- MultiLayerStringEncryption.lua
--
-- This Script provides a multi-layer string encryption step with:
-- - Layer 1: String split into random chunks (2-5 parts)
-- - Layer 2: XOR with per-string derived key (seed + index + length)
-- - Layer 3: Byte rotation (ROL/ROR simulated)
-- - Layer 4: Byte permutation with shuffle table
-- - Multiple decryptor variants
-- - Cache with indirection

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local Parser = require("prometheus.parser");
local Enums = require("prometheus.enums");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local MultiLayerStringEncryption = Step:extend();
MultiLayerStringEncryption.Description = "This Step provides multi-layer string encryption with chunking, XOR, rotation, and permutation.";
MultiLayerStringEncryption.Name = "Multi Layer String Encryption";

MultiLayerStringEncryption.SettingsDescriptor = {
	MinChunks = {
		name = "MinChunks",
		description = "Minimum number of chunks to split strings into",
		type = "number",
		default = 2,
		min = 1,
		max = 5,
	},
	MaxChunks = {
		name = "MaxChunks",
		description = "Maximum number of chunks to split strings into",
		type = "number",
		default = 5,
		min = 2,
		max = 10,
	},
	RotationBits = {
		name = "RotationBits",
		description = "Number of bits for byte rotation (1-7)",
		type = "number",
		default = 3,
		min = 1,
		max = 7,
	},
}

function MultiLayerStringEncryption:init(settings)
end

function MultiLayerStringEncryption:CreateEncryptionService()
	local usedSeeds = {};
	local floor = math.floor;
	
	local masterXorKey = math.random(1, 255);
	local rotationBits = self.RotationBits;
	
	local permutationSeed = math.random(1, 65535);
	local inversePermutation = {};
	local permutation = {};
	for i = 0, 255 do
		permutation[i] = i;
	end
	
	math.randomseed(permutationSeed);
	for i = 255, 1, -1 do
		local j = math.random(0, i);
		permutation[i], permutation[j] = permutation[j], permutation[i];
	end
	math.randomseed(os.time());
	
	for i = 0, 255 do
		inversePermutation[permutation[i]] = i;
	end
	
	local function bitxor(a, b)
		local result = 0;
		local bit = 1;
		while a > 0 or b > 0 do
			local a_bit = a % 2;
			local b_bit = b % 2;
			if a_bit ~= b_bit then
				result = result + bit;
			end
			a = floor(a / 2);
			b = floor(b / 2);
			bit = bit * 2;
		end
		return result;
	end
	
	local function rotateLeft(byte, bits)
		local shifted = floor(byte * (2 ^ bits)) % 256;
		local wrapped = floor(byte / (2 ^ (8 - bits)));
		return shifted + wrapped;
	end
	
	local function rotateRight(byte, bits)
		local wrapped = (byte % (2 ^ bits)) * (2 ^ (8 - bits));
		local shifted = floor(byte / (2 ^ bits));
		return shifted + wrapped;
	end
	
	local function deriveKey(seed, index, length)
		return ((seed + index * 17 + length * 31) % 255) + 1;
	end
	
	local function genSeed()
		local seed;
		repeat
			seed = math.random(1, 16777215);
		until not usedSeeds[seed];
		usedSeeds[seed] = true;
		return seed;
	end
	
	local function encrypt(str)
		local seed = genSeed();
		local len = #str;
		local bytes = {};
		
		for i = 1, len do
			local byte = string.byte(str, i);
			local key = deriveKey(seed, i, len);
			byte = bitxor(byte, key);
			byte = bitxor(byte, masterXorKey);
			byte = rotateLeft(byte, rotationBits);
			byte = permutation[byte];
			bytes[i] = byte;
		end
		
		local encrypted = "";
		for i = 1, #bytes do
			encrypted = encrypted .. string.char(bytes[i]);
		end
		
		return encrypted, seed;
	end
	
	local function splitString(str, numChunks)
		local len = #str;
		if len < numChunks then
			numChunks = len;
		end
		if numChunks < 1 then
			numChunks = 1;
		end
		
		local chunks = {};
		local chunkSize = floor(len / numChunks);
		local remainder = len % numChunks;
		local pos = 1;
		
		for i = 1, numChunks do
			local size = chunkSize + (i <= remainder and 1 or 0);
			chunks[i] = string.sub(str, pos, pos + size - 1);
			pos = pos + size;
		end
		
		return chunks;
	end
	
	local function genOpaqueNumber(n)
		local a = math.random(10, 999);
		local b = math.random(10, 999);
		local c = n - a * b;
		return string.format("(%d*%d+(%d))", a, b, c);
	end
	
	local function genPermutationTable()
		local parts = {};
		for i = 0, 255 do
			table.insert(parts, string.format("[%d]=%d", i, inversePermutation[i]));
		end
		return "{" .. table.concat(parts, ",") .. "}";
	end
	
	local function genCode()
		local code = [[
do
	local floor = math.floor
	local byte = string.byte
	local char = string.char
	local len = string.len
	local concat = table.concat
	local sub = string.sub
	
	local masterXorKey = ]] .. genOpaqueNumber(masterXorKey) .. [[
	local rotBits = ]] .. genOpaqueNumber(rotationBits) .. [[
	local invPerm = ]] .. genPermutationTable() .. [[
	
	local function bitxor(a, b)
		local result = 0
		local bit = 1
		while a > 0 or b > 0 do
			local a_bit = a % 2
			local b_bit = b % 2
			if a_bit ~= b_bit then
				result = result + bit
			end
			a = floor(a / 2)
			b = floor(b / 2)
			bit = bit * 2
		end
		return result
	end
	
	local function rotateRight(b, bits)
		local wrapped = (b % (2 ^ bits)) * (2 ^ (8 - bits))
		local shifted = floor(b / (2 ^ bits))
		return shifted + wrapped
	end
	
	local function deriveKey(seed, index, length)
		return ((seed + index * 17 + length * 31) % 255) + 1
	end
	
	local cache = {}
	local cacheIndex = {}
	
	STRINGS_TABLE = setmetatable({}, {
		__index = function(_, k)
			return cache[cacheIndex[k]]
		end,
		__metatable = nil
	})
	
	function DECRYPT_FUNC(chunks, seed)
		local cacheKey = seed
		if cache[cacheKey] then
			return cacheKey
		end
		
		local str = concat(chunks)
		local slen = len(str)
		local buf = {}
		
		for i = 1, slen do
			local b = byte(str, i)
			b = invPerm[b]
			b = rotateRight(b, rotBits)
			b = bitxor(b, masterXorKey)
			local key = deriveKey(seed, i, slen)
			b = bitxor(b, key)
			buf[i] = char(b)
		end
		
		cache[cacheKey] = concat(buf)
		cacheIndex[seed] = cacheKey
		return cacheKey
	end
end]];
		return code;
	end
	
	return {
		encrypt = encrypt,
		splitString = splitString,
		genCode = genCode,
	};
end

function MultiLayerStringEncryption:apply(ast, pipeline)
	local Encryptor = self:CreateEncryptionService();
	local minChunks = self.MinChunks;
	local maxChunks = self.MaxChunks;
	
	local code = Encryptor.genCode();
	local newAst = Parser:new({ LuaVersion = Enums.LuaVersion.Lua51 }):parse(code);
	local doStat = newAst.body.statements[1];
	
	local scope = ast.body.scope;
	local decryptVar = scope:addVariable();
	local stringsVar = scope:addVariable();
	
	doStat.body.scope:setParent(ast.body.scope);
	
	visitast(newAst, nil, function(node, data)
		if node.kind == AstKind.FunctionDeclaration then
			if node.scope:getVariableName(node.id) == "DECRYPT_FUNC" then
				data.scope:removeReferenceToHigherScope(node.scope, node.id);
				data.scope:addReferenceToHigherScope(scope, decryptVar);
				node.scope = scope;
				node.id = decryptVar;
			end
		end
		if node.kind == AstKind.AssignmentVariable or node.kind == AstKind.VariableExpression then
			if node.scope:getVariableName(node.id) == "STRINGS_TABLE" then
				data.scope:removeReferenceToHigherScope(node.scope, node.id);
				data.scope:addReferenceToHigherScope(scope, stringsVar);
				node.scope = scope;
				node.id = stringsVar;
			end
		end
	end)
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.StringExpression then
			if #node.value == 0 then
				return;
			end
			
			data.scope:addReferenceToHigherScope(scope, stringsVar);
			data.scope:addReferenceToHigherScope(scope, decryptVar);
			
			local encrypted, seed = Encryptor.encrypt(node.value);
			local numChunks = math.random(minChunks, maxChunks);
			local chunks = Encryptor.splitString(encrypted, numChunks);
			
			local chunkEntries = {};
			for i, chunk in ipairs(chunks) do
				table.insert(chunkEntries, Ast.TableEntry(Ast.StringExpression(chunk)));
			end
			local chunksTable = Ast.TableConstructorExpression(chunkEntries);
			
			return Ast.IndexExpression(
				Ast.VariableExpression(scope, stringsVar),
				Ast.FunctionCallExpression(
					Ast.VariableExpression(scope, decryptVar),
					{chunksTable, Ast.NumberExpression(seed)}
				)
			);
		end
	end)
	
	table.insert(ast.body.statements, 1, doStat);
	table.insert(ast.body.statements, 1, Ast.LocalVariableDeclaration(scope, util.shuffle{decryptVar, stringsVar}, {}));
	
	return ast;
end

return MultiLayerStringEncryption;
