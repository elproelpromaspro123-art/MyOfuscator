-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ControlFlowFlatten.lua
--
-- This Script provides an Obfuscation Step that flattens control flow
-- by transforming function bodies into a state machine with while true + dispatcher pattern

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local ControlFlowFlatten = Step:extend();
ControlFlowFlatten.Description = "This Step flattens control flow by transforming function bodies into a state machine with a dispatcher pattern.";
ControlFlowFlatten.Name = "Control Flow Flatten";

ControlFlowFlatten.SettingsDescriptor = {
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
		default = 0.8,
		min = 0,
		max = 1,
	},
}

function ControlFlowFlatten:init(settings)
end

function ControlFlowFlatten:splitIntoBlocks(statements, maxSize)
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

function ControlFlowFlatten:generateStateOrder(numBlocks)
	local order = {};
	for i = 1, numBlocks do
		order[i] = i;
	end
	util.shuffle(order);
	
	local stateMapping = {};
	for i, v in ipairs(order) do
		stateMapping[i] = v * math.random(2, 7);
	end
	
	return stateMapping;
end

function ControlFlowFlatten:flattenBlock(block, parentScope)
	local statements = block.statements;
	if #statements < 4 then
		return nil;
	end
	
	local blocks = self:splitIntoBlocks(statements, self.MaxBlockSize);
	if #blocks < 2 then
		return nil;
	end
	
	local stateMapping = self:generateStateOrder(#blocks);
	local endState = (#blocks + 1) * math.random(11, 17);
	
	local stateVarId = block.scope:addVariable();
	local initialState = stateMapping[1];
	
	local dispatcherCases = {};
	
	for i, blk in ipairs(blocks) do
		local currentState = stateMapping[i];
		local nextState = (i < #blocks) and stateMapping[i + 1] or endState;
		
		local blockStatements = {};
		local hasTerminator = false;
		
		for _, stmt in ipairs(blk) do
			if stmt.kind == AstKind.ReturnStatement then
				hasTerminator = true;
				table.insert(blockStatements, stmt);
			elseif stmt.kind == AstKind.BreakStatement or stmt.kind == AstKind.ContinueStatement then
				hasTerminator = true;
				table.insert(blockStatements, Ast.AssignmentStatement(
					{Ast.AssignmentVariable(block.scope, stateVarId)},
					{Ast.NumberExpression(endState)}
				));
			else
				table.insert(blockStatements, stmt);
			end
		end
		
		if not hasTerminator then
			table.insert(blockStatements, Ast.AssignmentStatement(
				{Ast.AssignmentVariable(block.scope, stateVarId)},
				{Ast.NumberExpression(nextState)}
			));
		end
		
		local caseScope = Scope:new(block.scope);
		local caseBody = Ast.Block(blockStatements, caseScope);
		
		table.insert(dispatcherCases, {
			state = currentState,
			body = caseBody,
		});
	end
	
	util.shuffle(dispatcherCases);
	
	local ifChain = nil;
	local lastElse = nil;
	
	for i = #dispatcherCases, 1, -1 do
		local case = dispatcherCases[i];
		local condition = Ast.EqualsExpression(
			Ast.VariableExpression(block.scope, stateVarId),
			Ast.NumberExpression(case.state)
		);
		
		if ifChain == nil then
			ifChain = Ast.IfStatement(condition, case.body, {}, nil);
		else
			local newIf = Ast.IfStatement(condition, case.body, {}, ifChain);
			ifChain = newIf;
		end
	end
	
	local breakCondition = Ast.EqualsExpression(
		Ast.VariableExpression(block.scope, stateVarId),
		Ast.NumberExpression(endState)
	);
	local breakScope = Scope:new(block.scope);
	local breakIf = Ast.IfStatement(breakCondition, Ast.Block({Ast.BreakStatement()}, breakScope), {}, nil);
	
	local whileScope = Scope:new(block.scope);
	local whileBody = Ast.Block({ifChain, breakIf}, whileScope);
	local whileLoop = Ast.WhileStatement(whileBody, Ast.BooleanExpression(true));
	
	local initDecl = Ast.LocalVariableDeclaration(
		block.scope,
		{stateVarId},
		{Ast.NumberExpression(initialState)}
	);
	
	return {initDecl, whileLoop};
end

function ControlFlowFlatten:apply(ast, pipeline)
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

return ControlFlowFlatten;
