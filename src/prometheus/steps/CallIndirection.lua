-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- CallIndirection.lua
--
-- This Script provides an Obfuscation Step that replaces direct function calls
-- with indirect calls through a dispatch table

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local CallIndirection = Step:extend();
CallIndirection.Description = "This Step replaces direct function calls with indirect calls through a dispatch table.";
CallIndirection.Name = "Call Indirection";

CallIndirection.SettingsDescriptor = {
	Threshold = {
		name = "Threshold",
		description = "Probability of applying indirection to a function call (0-1)",
		type = "number",
		default = 0.5,
		min = 0,
		max = 1,
	},
}

function CallIndirection:init(settings)
end

function CallIndirection:apply(ast, pipeline)
	local self2 = self;
	local collectedCalls = {};
	local callToIndex = {};
	local callCount = 0;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.FunctionCallExpression then
			if node.base.kind == AstKind.VariableExpression then
				if math.random() < self2.Threshold then
					local baseScope = node.base.scope;
					local baseId = node.base.id;
					
					if baseScope.isGlobal then
						local key = tostring(baseScope) .. "_" .. tostring(baseId);
						
						if not callToIndex[key] then
							callCount = callCount + 1;
							callToIndex[key] = callCount;
							collectedCalls[callCount] = {
								scope = baseScope,
								id = baseId,
							};
						end
						
						node.__callIndirectionIndex = callToIndex[key];
					end
				end
			elseif node.base.kind == AstKind.IndexExpression then
				if node.base.base.kind == AstKind.VariableExpression and 
				   node.base.index.kind == AstKind.StringExpression then
					if math.random() < self2.Threshold then
						local baseScope = node.base.base.scope;
						local baseId = node.base.base.id;
						local indexValue = node.base.index.value;
						
						if baseScope.isGlobal then
							local key = tostring(baseScope) .. "_" .. tostring(baseId) .. "_" .. indexValue;
							
							if not callToIndex[key] then
								callCount = callCount + 1;
								callToIndex[key] = callCount;
								collectedCalls[callCount] = {
									scope = baseScope,
									id = baseId,
									index = indexValue,
								};
							end
							
							node.__callIndirectionIndex = callToIndex[key];
							node.__callIndirectionIsIndexed = true;
						end
					end
				end
			end
		end
	end)
	
	if callCount == 0 then
		return ast;
	end
	
	local dispatchTableId = ast.body.scope:addVariable();
	local dispatchTableScope = ast.body.scope;
	
	local shuffledIndices = {};
	for i = 1, callCount do
		shuffledIndices[i] = i;
	end
	util.shuffle(shuffledIndices);
	
	local indexMapping = {};
	for i, v in ipairs(shuffledIndices) do
		indexMapping[v] = shuffledIndices[i] * math.random(2, 5);
	end
	
	local tableEntries = {};
	for i = 1, callCount do
		local call = collectedCalls[i];
		local mappedIndex = indexMapping[i];
		
		local funcExpr;
		if call.index then
			ast.body.scope:addReferenceToHigherScope(call.scope, call.id);
			funcExpr = Ast.IndexExpression(
				Ast.VariableExpression(call.scope, call.id),
				Ast.StringExpression(call.index)
			);
		else
			ast.body.scope:addReferenceToHigherScope(call.scope, call.id);
			funcExpr = Ast.VariableExpression(call.scope, call.id);
		end
		
		table.insert(tableEntries, Ast.KeyedTableEntry(
			Ast.NumberExpression(mappedIndex),
			funcExpr
		));
	end
	
	util.shuffle(tableEntries);
	
	local dispatchTableDecl = Ast.LocalVariableDeclaration(
		dispatchTableScope,
		{dispatchTableId},
		{Ast.TableConstructorExpression(tableEntries)}
	);
	
	table.insert(ast.body.statements, 1, dispatchTableDecl);
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.FunctionCallExpression and node.__callIndirectionIndex then
			local mappedIndex = indexMapping[node.__callIndirectionIndex];
			
			data.scope:addReferenceToHigherScope(dispatchTableScope, dispatchTableId);
			
			local newBase = Ast.IndexExpression(
				Ast.VariableExpression(dispatchTableScope, dispatchTableId),
				Ast.NumberExpression(mappedIndex)
			);
			
			node.base = newBase;
			node.__callIndirectionIndex = nil;
			node.__callIndirectionIsIndexed = nil;
		end
	end)
	
	return ast;
end

return CallIndirection;
