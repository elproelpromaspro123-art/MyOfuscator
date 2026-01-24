-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- AdvancedControlFlow.lua
--
-- This Script provides an advanced Control Flow Flattening step that uses
-- a dispatch table with closures instead of if/elseif chains.
-- Features:
-- - States encoded with Linear Congruential Generator (LCG): state = (state * A + B) % M
-- - Blocks stored as anonymous functions in dispatch table
-- - Dead clones (fake blocks that never execute)
-- - Randomized block order

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local AdvancedControlFlow = Step:extend();
AdvancedControlFlow.Description = "This Step provides advanced control flow flattening using dispatch tables with closures and LCG-encoded state transitions.";
AdvancedControlFlow.Name = "Advanced Control Flow";

AdvancedControlFlow.SettingsDescriptor = {
	MaxBlockSize = {
		name = "MaxBlockSize",
		description = "Maximum number of statements per flattened block",
		type = "number",
		default = 3,
		min = 1,
		max = 10,
	},
	FlattenProbability = {
		name = "FlattenProbability",
		description = "Probability of flattening a function body (0-1)",
		type = "number",
		default = 0.7,
		min = 0,
		max = 1,
	},
	DeadClones = {
		name = "DeadClones",
		description = "Number of dead (fake) blocks to insert",
		type = "number",
		default = 3,
		min = 0,
		max = 10,
	},
	LCGModulus = {
		name = "LCGModulus",
		description = "Modulus for LCG state encoding (prime recommended)",
		type = "number",
		default = 65537,
		min = 1000,
		max = 1000000,
	},
}

function AdvancedControlFlow:init(settings)
end

function AdvancedControlFlow:generateLCGParams()
	local M = self.LCGModulus;
	local A = math.random(1000, M - 1);
	while self:gcd(A, M) ~= 1 do
		A = math.random(1000, M - 1);
	end
	local B = math.random(1, M - 1);
	return A, B, M;
end

function AdvancedControlFlow:gcd(a, b)
	while b ~= 0 do
		a, b = b, a % b;
	end
	return a;
end

function AdvancedControlFlow:lcgNext(state, A, B, M)
	return (state * A + B) % M;
end

function AdvancedControlFlow:splitIntoBlocks(statements, maxSize)
	local blocks = {};
	local currentBlock = {};
	
	for i, stmt in ipairs(statements) do
		table.insert(currentBlock, stmt);
		if #currentBlock >= maxSize or 
		   stmt.kind == AstKind.ReturnStatement or
		   stmt.kind == AstKind.BreakStatement or
		   stmt.kind == AstKind.ContinueStatement then
			table.insert(blocks, currentBlock);
			currentBlock = {};
		end
	end
	
	if #currentBlock > 0 then
		table.insert(blocks, currentBlock);
	end
	
	return blocks;
end

function AdvancedControlFlow:generateDeadBlock(scope)
	local statements = {};
	local numStatements = math.random(1, 3);
	
	for i = 1, numStatements do
		local choice = math.random(1, 4);
		if choice == 1 then
			local varId = scope:addVariable();
			local expr = Ast.NumberExpression(math.random(-10000, 10000));
			table.insert(statements, Ast.LocalVariableDeclaration(scope, {varId}, {expr}));
		elseif choice == 2 then
			local varId = scope:addVariable();
			local a = Ast.NumberExpression(math.random(1, 100));
			local b = Ast.NumberExpression(math.random(1, 100));
			table.insert(statements, Ast.LocalVariableDeclaration(scope, {varId}, {Ast.AddExpression(a, b)}));
		elseif choice == 3 then
			local varId = scope:addVariable();
			table.insert(statements, Ast.LocalVariableDeclaration(scope, {varId}, {Ast.StringExpression(self:randomString(8))}));
		else
			local varId = scope:addVariable();
			local expr = Ast.MulExpression(
				Ast.NumberExpression(math.random(1, 50)),
				Ast.NumberExpression(math.random(1, 50))
			);
			table.insert(statements, Ast.LocalVariableDeclaration(scope, {varId}, {expr}));
		end
	end
	
	return statements;
end

function AdvancedControlFlow:randomString(length)
	local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	local result = "";
	for i = 1, length do
		local idx = math.random(1, #chars);
		result = result .. string.sub(chars, idx, idx);
	end
	return result;
end

function AdvancedControlFlow:flattenBlock(block, parentScope)
	local statements = block.statements;
	if #statements < 4 then
		return nil;
	end
	
	local blocks = self:splitIntoBlocks(statements, self.MaxBlockSize);
	if #blocks < 2 then
		return nil;
	end
	
	local A, B, M = self:generateLCGParams();
	
	local stateValues = {};
	local currentState = math.random(1, M - 1);
	local initialState = currentState;
	
	for i = 1, #blocks do
		stateValues[i] = currentState;
		currentState = self:lcgNext(currentState, A, B, M);
	end
	local endState = currentState;
	
	local stateVarId = block.scope:addVariable();
	local dispatchTableId = block.scope:addVariable();
	
	local tableEntries = {};
	
	for i, blk in ipairs(blocks) do
		local currentStateVal = stateValues[i];
		local nextStateVal = (i < #blocks) and stateValues[i + 1] or endState;
		
		local blockStatements = {};
		local hasTerminator = false;
		
		for _, stmt in ipairs(blk) do
			if stmt.kind == AstKind.ReturnStatement then
				hasTerminator = true;
				table.insert(blockStatements, stmt);
			elseif stmt.kind == AstKind.BreakStatement or stmt.kind == AstKind.ContinueStatement then
				hasTerminator = true;
				table.insert(blockStatements, Ast.ReturnStatement({Ast.NumberExpression(endState)}));
			else
				table.insert(blockStatements, stmt);
			end
		end
		
		if not hasTerminator then
			table.insert(blockStatements, Ast.ReturnStatement({Ast.NumberExpression(nextStateVal)}));
		end
		
		local funcScope = Scope:new(block.scope);
		local funcBody = Ast.Block(blockStatements, funcScope);
		local funcLiteral = Ast.FunctionLiteralExpression({}, funcBody);
		
		table.insert(tableEntries, Ast.KeyedTableEntry(
			Ast.NumberExpression(currentStateVal),
			funcLiteral
		));
	end
	
	for i = 1, self.DeadClones do
		local deadState = math.random(M, M * 2);
		local deadScope = Scope:new(block.scope);
		local deadStatements = self:generateDeadBlock(deadScope);
		local deadNextState = math.random(1, M - 1);
		table.insert(deadStatements, Ast.ReturnStatement({Ast.NumberExpression(deadNextState)}));
		local deadBody = Ast.Block(deadStatements, deadScope);
		local deadFunc = Ast.FunctionLiteralExpression({}, deadBody);
		
		table.insert(tableEntries, Ast.KeyedTableEntry(
			Ast.NumberExpression(deadState),
			deadFunc
		));
	end
	
	util.shuffle(tableEntries);
	
	local dispatchTableDecl = Ast.LocalVariableDeclaration(
		block.scope,
		{dispatchTableId},
		{Ast.TableConstructorExpression(tableEntries)}
	);
	
	local stateDecl = Ast.LocalVariableDeclaration(
		block.scope,
		{stateVarId},
		{Ast.NumberExpression(initialState)}
	);
	
	local fVarId = block.scope:addVariable();
	local whileScope = Scope:new(block.scope);
	
	local fDecl = Ast.LocalVariableDeclaration(
		whileScope,
		{fVarId},
		{Ast.IndexExpression(
			Ast.VariableExpression(block.scope, dispatchTableId),
			Ast.VariableExpression(block.scope, stateVarId)
		)}
	);
	
	local breakCondition = Ast.NotExpression(Ast.VariableExpression(whileScope, fVarId));
	local breakScope = Scope:new(whileScope);
	local breakIf = Ast.IfStatement(
		breakCondition,
		Ast.Block({Ast.BreakStatement()}, breakScope),
		{},
		nil
	);
	
	local stateUpdate = Ast.AssignmentStatement(
		{Ast.AssignmentVariable(block.scope, stateVarId)},
		{Ast.FunctionCallExpression(Ast.VariableExpression(whileScope, fVarId), {})}
	);
	
	local whileBody = Ast.Block({fDecl, breakIf, stateUpdate}, whileScope);
	local whileLoop = Ast.WhileStatement(whileBody, Ast.BooleanExpression(true));
	
	return {dispatchTableDecl, stateDecl, whileLoop};
end

function AdvancedControlFlow:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.FunctionLiteralExpression or 
		   node.kind == AstKind.FunctionDeclaration or 
		   node.kind == AstKind.LocalFunctionDeclaration then
			
			if math.random() > self2.FlattenProbability then
				return;
			end
			
			local body = node.body;
			if body and body.statements and #body.statements >= 4 then
				local result = self2:flattenBlock(body, body.scope);
				if result then
					body.statements = result;
				end
			end
		end
	end)
	
	return ast;
end

return AdvancedControlFlow;
