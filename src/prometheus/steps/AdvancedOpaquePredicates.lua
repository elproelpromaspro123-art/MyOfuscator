-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- AdvancedOpaquePredicates.lua
--
-- This Script provides advanced opaque predicates based on:
-- - Number theory: (x^2 + x) % 2 == 0 is always true
-- - Fermat's theorem properties
-- - Bit operations: (x | ~x) == -1
-- - Context-dependent predicates (string lengths, hash values)
-- - Combinations of AND/OR of multiple predicates
-- - Intermediate local variables to hide calculations

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local AdvancedOpaquePredicates = Step:extend();
AdvancedOpaquePredicates.Description = "This Step inserts advanced opaque predicates based on number theory, bit operations, and context-dependent conditions.";
AdvancedOpaquePredicates.Name = "Advanced Opaque Predicates";

AdvancedOpaquePredicates.SettingsDescriptor = {
	Density = {
		name = "Density",
		description = "Probability of wrapping a statement with an opaque predicate (0-1)",
		type = "number",
		default = 0.25,
		min = 0,
		max = 1,
	},
	Complexity = {
		name = "Complexity",
		description = "Complexity level of generated predicates (1-5)",
		type = "number",
		default = 3,
		min = 1,
		max = 5,
	},
	UseIntermediateVars = {
		name = "UseIntermediateVars",
		description = "Use intermediate local variables to hide calculations",
		type = "boolean",
		default = true,
	},
}

function AdvancedOpaquePredicates:init(settings)
end

function AdvancedOpaquePredicates:generateNumberTheoryTrue(scope)
	local generators = {
		function()
			local x = math.random(1, 1000);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.AddExpression(
						Ast.MulExpression(Ast.NumberExpression(x), Ast.NumberExpression(x)),
						Ast.NumberExpression(x)
					),
					Ast.NumberExpression(2)
				),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local n = math.random(2, 100);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.MulExpression(
						Ast.NumberExpression(n),
						Ast.SubExpression(Ast.NumberExpression(n), Ast.NumberExpression(1))
					),
					Ast.NumberExpression(2)
				),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local a = math.random(1, 50);
			local b = math.random(1, 50);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.SubExpression(
						Ast.PowExpression(Ast.NumberExpression(a + b), Ast.NumberExpression(2)),
						Ast.AddExpression(
							Ast.AddExpression(
								Ast.PowExpression(Ast.NumberExpression(a), Ast.NumberExpression(2)),
								Ast.MulExpression(
									Ast.NumberExpression(2),
									Ast.MulExpression(Ast.NumberExpression(a), Ast.NumberExpression(b))
								)
							),
							Ast.PowExpression(Ast.NumberExpression(b), Ast.NumberExpression(2))
						)
					),
					Ast.NumberExpression(1000)
				),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local n = math.random(1, 20);
			local sum = n * (n + 1) / 2;
			return Ast.EqualsExpression(
				Ast.DivExpression(
					Ast.MulExpression(Ast.NumberExpression(n), Ast.AddExpression(Ast.NumberExpression(n), Ast.NumberExpression(1))),
					Ast.NumberExpression(2)
				),
				Ast.NumberExpression(sum)
			);
		end,
		function()
			local x = math.random(2, 50);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.SubExpression(
						Ast.PowExpression(Ast.NumberExpression(x), Ast.NumberExpression(2)),
						Ast.NumberExpression(x)
					),
					Ast.NumberExpression(x)
				),
				Ast.NumberExpression(0)
			);
		end,
	};
	
	return generators[math.random(#generators)]();
end

function AdvancedOpaquePredicates:generateBitOperationTrue(scope)
	local generators = {
		function()
			local x = math.random(1, 255);
			local bit32Access = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("bor")
			);
			local bnotAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("bnot")
			);
			local innerNot = Ast.FunctionCallExpression(bnotAccess, {Ast.NumberExpression(x)});
			local orResult = Ast.FunctionCallExpression(bit32Access, {Ast.NumberExpression(x), innerNot});
			return Ast.EqualsExpression(orResult, Ast.NumberExpression(4294967295));
		end,
		function()
			local x = math.random(1, 255);
			local bandAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("band")
			);
			local andResult = Ast.FunctionCallExpression(bandAccess, {Ast.NumberExpression(x), Ast.NumberExpression(x)});
			return Ast.EqualsExpression(andResult, Ast.NumberExpression(x));
		end,
		function()
			local x = math.random(1, 127);
			local lshiftAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("lshift")
			);
			local rshiftAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("rshift")
			);
			local shifted = Ast.FunctionCallExpression(lshiftAccess, {Ast.NumberExpression(x), Ast.NumberExpression(1)});
			local unshifted = Ast.FunctionCallExpression(rshiftAccess, {shifted, Ast.NumberExpression(1)});
			return Ast.EqualsExpression(unshifted, Ast.NumberExpression(x));
		end,
		function()
			local x = math.random(1, 255);
			local bxorAccess = Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
				Ast.StringExpression("bxor")
			);
			local xorResult = Ast.FunctionCallExpression(bxorAccess, {Ast.NumberExpression(x), Ast.NumberExpression(x)});
			return Ast.EqualsExpression(xorResult, Ast.NumberExpression(0));
		end,
	};
	
	return generators[math.random(#generators)]();
end

function AdvancedOpaquePredicates:generateContextDependentTrue(scope)
	local generators = {
		function()
			local str = self:randomString(math.random(5, 15));
			local lenExpr = Ast.LenExpression(Ast.StringExpression(str));
			return Ast.EqualsExpression(lenExpr, Ast.NumberExpression(#str));
		end,
		function()
			local str = self:randomString(10);
			local lenExpr = Ast.LenExpression(Ast.StringExpression(str));
			return Ast.GreaterThanExpression(lenExpr, Ast.NumberExpression(0));
		end,
		function()
			local str = self:randomString(8);
			local lenExpr = Ast.LenExpression(Ast.StringExpression(str));
			return Ast.LessThanExpression(lenExpr, Ast.NumberExpression(100));
		end,
		function()
			local typeAccess = Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("type"));
			local typeCall = Ast.FunctionCallExpression(typeAccess, {Ast.NumberExpression(42)});
			return Ast.EqualsExpression(typeCall, Ast.StringExpression("number"));
		end,
		function()
			local typeAccess = Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("type"));
			local typeCall = Ast.FunctionCallExpression(typeAccess, {Ast.StringExpression("test")});
			return Ast.EqualsExpression(typeCall, Ast.StringExpression("string"));
		end,
	};
	
	return generators[math.random(#generators)]();
end

function AdvancedOpaquePredicates:randomString(length)
	local chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	local result = "";
	for i = 1, length do
		local idx = math.random(1, #chars);
		result = result .. string.sub(chars, idx, idx);
	end
	return result;
end

function AdvancedOpaquePredicates:generateOpaqueTrue(scope, complexity)
	local predicateGenerators = {
		function() return self:generateNumberTheoryTrue(scope) end,
		function() return self:generateContextDependentTrue(scope) end,
	};
	
	if complexity >= 2 then
		table.insert(predicateGenerators, function() return self:generateBitOperationTrue(scope) end);
	end
	
	local basePredicate = predicateGenerators[math.random(#predicateGenerators)]();
	
	if complexity >= 3 then
		local secondPredicate = predicateGenerators[math.random(#predicateGenerators)]();
		basePredicate = Ast.AndExpression(basePredicate, secondPredicate);
	end
	
	if complexity >= 4 then
		local thirdPredicate = predicateGenerators[math.random(#predicateGenerators)]();
		if math.random() < 0.5 then
			basePredicate = Ast.AndExpression(basePredicate, thirdPredicate);
		else
			basePredicate = Ast.OrExpression(basePredicate, thirdPredicate);
		end
	end
	
	if complexity >= 5 then
		local extra1 = predicateGenerators[math.random(#predicateGenerators)]();
		local extra2 = predicateGenerators[math.random(#predicateGenerators)]();
		basePredicate = Ast.AndExpression(
			basePredicate,
			Ast.OrExpression(extra1, extra2)
		);
	end
	
	return basePredicate;
end

function AdvancedOpaquePredicates:generateOpaqueFalse(scope, complexity)
	local generators = {
		function()
			local x = math.random(1, 100);
			return Ast.EqualsExpression(
				Ast.ModExpression(
					Ast.AddExpression(
						Ast.MulExpression(Ast.NumberExpression(x), Ast.NumberExpression(x)),
						Ast.NumberExpression(x)
					),
					Ast.NumberExpression(2)
				),
				Ast.NumberExpression(1)
			);
		end,
		function()
			local n = math.random(2, 50);
			return Ast.LessThanExpression(
				Ast.PowExpression(Ast.NumberExpression(n), Ast.NumberExpression(2)),
				Ast.NumberExpression(0)
			);
		end,
		function()
			local str = self:randomString(10);
			return Ast.EqualsExpression(
				Ast.LenExpression(Ast.StringExpression(str)),
				Ast.NumberExpression(#str + 1)
			);
		end,
		function()
			local a = math.random(1, 50);
			local b = math.random(51, 100);
			return Ast.GreaterThanExpression(Ast.NumberExpression(a), Ast.NumberExpression(b));
		end,
		function()
			return Ast.AndExpression(
				Ast.BooleanExpression(true),
				Ast.BooleanExpression(false)
			);
		end,
	};
	
	local basePredicate = generators[math.random(#generators)]();
	
	if complexity >= 3 then
		local falsePred = generators[math.random(#generators)]();
		basePredicate = Ast.OrExpression(basePredicate, falsePred);
	end
	
	return basePredicate;
end

function AdvancedOpaquePredicates:wrapWithOpaqueTrue(statement, scope, complexity)
	local condition = self:generateOpaqueTrue(scope, complexity);
	
	if self.UseIntermediateVars and complexity >= 2 then
		local condVarId = scope:addVariable();
		local condDecl = Ast.LocalVariableDeclaration(scope, {condVarId}, {condition});
		local bodyScope = Scope:new(scope);
		local body = Ast.Block({statement}, bodyScope);
		local ifStmt = Ast.IfStatement(Ast.VariableExpression(scope, condVarId), body, {}, nil);
		return {condDecl, ifStmt};
	else
		local bodyScope = Scope:new(scope);
		local body = Ast.Block({statement}, bodyScope);
		return {Ast.IfStatement(condition, body, {}, nil)};
	end
end

function AdvancedOpaquePredicates:wrapWithOpaqueFalseElse(statement, scope, complexity)
	local condition = self:generateOpaqueFalse(scope, complexity);
	local dummyScope = Scope:new(scope);
	local dummyStatements = {};
	
	local dummyVarId = dummyScope:addVariable();
	table.insert(dummyStatements, Ast.LocalVariableDeclaration(dummyScope, {dummyVarId}, {Ast.NumberExpression(math.random(1, 1000))}));
	
	local dummyBody = Ast.Block(dummyStatements, dummyScope);
	local elseScope = Scope:new(scope);
	local elseBody = Ast.Block({statement}, elseScope);
	
	if self.UseIntermediateVars and complexity >= 2 then
		local condVarId = scope:addVariable();
		local condDecl = Ast.LocalVariableDeclaration(scope, {condVarId}, {condition});
		local ifStmt = Ast.IfStatement(Ast.VariableExpression(scope, condVarId), dummyBody, {}, elseBody);
		return {condDecl, ifStmt};
	else
		return {Ast.IfStatement(condition, dummyBody, {}, elseBody)};
	end
end

function AdvancedOpaquePredicates:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if node.kind == AstKind.Block then
			local newStatements = {};
			
			for i, stmt in ipairs(node.statements) do
				if stmt.kind ~= AstKind.LocalVariableDeclaration and
				   stmt.kind ~= AstKind.LocalFunctionDeclaration and
				   stmt.kind ~= AstKind.FunctionDeclaration and
				   stmt.kind ~= AstKind.ReturnStatement and
				   stmt.kind ~= AstKind.BreakStatement and
				   stmt.kind ~= AstKind.ContinueStatement and
				   stmt.kind ~= AstKind.IfStatement and
				   stmt.kind ~= AstKind.WhileStatement and
				   stmt.kind ~= AstKind.ForStatement and
				   stmt.kind ~= AstKind.ForInStatement and
				   stmt.kind ~= AstKind.RepeatStatement and
				   stmt.kind ~= AstKind.DoStatement and
				   math.random() < self2.Density then
					
					local wrapped;
					if math.random() < 0.7 then
						wrapped = self2:wrapWithOpaqueTrue(stmt, node.scope, self2.Complexity);
					else
						wrapped = self2:wrapWithOpaqueFalseElse(stmt, node.scope, self2.Complexity);
					end
					
					for _, s in ipairs(wrapped) do
						table.insert(newStatements, s);
					end
				else
					table.insert(newStatements, stmt);
				end
			end
			
			node.statements = newStatements;
		end
	end)
	
	return ast;
end

return AdvancedOpaquePredicates;
