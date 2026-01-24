-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- MBAObfuscation.lua
--
-- This Script provides an Obfuscation Step that transforms arithmetic expressions
-- using Mixed Boolean-Arithmetic (MBA) identities. MBA transforms make expressions
-- harder to analyze by mixing boolean and arithmetic operations.
--
-- Examples of MBA identities:
-- x + y = (x ^ y) + 2*(x & y)
-- x - y = (x ^ y) - 2*(~x & y)
-- x * 2 = (x << 1)
-- -x = ~x + 1

local Step = require("prometheus.step");
local Ast = require("prometheus.ast");
local Scope = require("prometheus.scope");
local visitast = require("prometheus.visitast");
local util = require("prometheus.util");

local AstKind = Ast.AstKind;

local MBAObfuscation = Step:extend();
MBAObfuscation.Description = "This Step transforms arithmetic expressions using Mixed Boolean-Arithmetic (MBA) identities to obscure simple operations.";
MBAObfuscation.Name = "MBA Obfuscation";

MBAObfuscation.SettingsDescriptor = {
	Probability = {
		name = "Probability",
		description = "Probability of applying MBA transformation to an expression (0-1)",
		type = "number",
		default = 0.5,
		min = 0,
		max = 1,
	},
	MaxDepth = {
		name = "MaxDepth",
		description = "Maximum depth of nested MBA transformations",
		type = "number",
		default = 2,
		min = 1,
		max = 5,
	},
	UseBit32 = {
		name = "UseBit32",
		description = "Use bit32 library (for Lua 5.2+/LuaU compatibility)",
		type = "boolean",
		default = true,
	},
}

function MBAObfuscation:init(settings)
	self.currentDepth = 0;
end

function MBAObfuscation:createBit32Call(scope, funcName, args)
	local bit32Expr = Ast.IndexExpression(
		Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("bit32")),
		Ast.StringExpression(funcName)
	);
	return Ast.FunctionCallExpression(bit32Expr, args);
end

function MBAObfuscation:createBitXor(scope, a, b)
	if self.UseBit32 then
		return self:createBit32Call(scope, "bxor", {a, b});
	else
		local floorCall = Ast.FunctionCallExpression(
			Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("math")),
				Ast.StringExpression("floor")
			),
			{a}
		);
		return floorCall;
	end
end

function MBAObfuscation:createBitAnd(scope, a, b)
	if self.UseBit32 then
		return self:createBit32Call(scope, "band", {a, b});
	else
		return Ast.ModExpression(a, b);
	end
end

function MBAObfuscation:createBitOr(scope, a, b)
	if self.UseBit32 then
		return self:createBit32Call(scope, "bor", {a, b});
	else
		return Ast.AddExpression(a, b);
	end
end

function MBAObfuscation:createBitNot(scope, a)
	if self.UseBit32 then
		return self:createBit32Call(scope, "bnot", {a});
	else
		return Ast.SubExpression(Ast.NegateExpression(a), Ast.NumberExpression(1));
	end
end

function MBAObfuscation:createBitLshift(scope, a, n)
	if self.UseBit32 then
		return self:createBit32Call(scope, "lshift", {a, Ast.NumberExpression(n)});
	else
		return Ast.MulExpression(a, Ast.NumberExpression(2^n));
	end
end

function MBAObfuscation:createBitRshift(scope, a, n)
	if self.UseBit32 then
		return self:createBit32Call(scope, "rshift", {a, Ast.NumberExpression(n)});
	else
		local floorExpr = Ast.FunctionCallExpression(
			Ast.IndexExpression(
				Ast.VariableExpression(scope.globalScope or scope, scope:resolveGlobal("math")),
				Ast.StringExpression("floor")
			),
			{Ast.DivExpression(a, Ast.NumberExpression(2^n))}
		);
		return floorExpr;
	end
end

function MBAObfuscation:cloneExpression(node)
	if node.kind == AstKind.NumberExpression then
		return Ast.NumberExpression(node.value);
	elseif node.kind == AstKind.VariableExpression then
		return Ast.VariableExpression(node.scope, node.id);
	elseif node.kind == AstKind.StringExpression then
		return Ast.StringExpression(node.value);
	elseif node.kind == AstKind.BooleanExpression then
		return Ast.BooleanExpression(node.value);
	else
		return node;
	end
end

function MBAObfuscation:transformAddition(scope, lhs, rhs)
	local choice = math.random(1, 4);
	
	if choice == 1 then
		local xorExpr = self:createBitXor(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local andExpr = self:createBitAnd(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local shiftedAnd = self:createBitLshift(scope, andExpr, 1);
		return Ast.AddExpression(xorExpr, shiftedAnd);
	elseif choice == 2 then
		local orExpr = self:createBitOr(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local andExpr = self:createBitAnd(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		return Ast.AddExpression(orExpr, andExpr);
	elseif choice == 3 then
		local k = math.random(1, 100);
		return Ast.SubExpression(
			Ast.AddExpression(
				Ast.AddExpression(self:cloneExpression(lhs), Ast.NumberExpression(k)),
				self:cloneExpression(rhs)
			),
			Ast.NumberExpression(k)
		);
	else
		local xorExpr = self:createBitXor(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local andExpr = self:createBitAnd(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local doubled = Ast.MulExpression(andExpr, Ast.NumberExpression(2));
		return Ast.AddExpression(xorExpr, doubled);
	end
end

function MBAObfuscation:transformSubtraction(scope, lhs, rhs)
	local choice = math.random(1, 3);
	
	if choice == 1 then
		local xorExpr = self:createBitXor(scope, self:cloneExpression(lhs), self:cloneExpression(rhs));
		local notLhs = self:createBitNot(scope, self:cloneExpression(lhs));
		local andExpr = self:createBitAnd(scope, notLhs, self:cloneExpression(rhs));
		local shiftedAnd = self:createBitLshift(scope, andExpr, 1);
		return Ast.SubExpression(xorExpr, shiftedAnd);
	elseif choice == 2 then
		local k = math.random(1, 100);
		return Ast.SubExpression(
			Ast.SubExpression(
				Ast.AddExpression(self:cloneExpression(lhs), Ast.NumberExpression(k)),
				self:cloneExpression(rhs)
			),
			Ast.NumberExpression(k)
		);
	else
		local negRhs = Ast.NegateExpression(self:cloneExpression(rhs));
		return self:transformAddition(scope, lhs, negRhs);
	end
end

function MBAObfuscation:transformMultiplication(scope, lhs, rhs)
	if rhs.kind == AstKind.NumberExpression and rhs.value == 2 then
		return self:createBitLshift(scope, self:cloneExpression(lhs), 1);
	elseif rhs.kind == AstKind.NumberExpression and rhs.value == 4 then
		return self:createBitLshift(scope, self:cloneExpression(lhs), 2);
	elseif rhs.kind == AstKind.NumberExpression and rhs.value == 8 then
		return self:createBitLshift(scope, self:cloneExpression(lhs), 3);
	elseif lhs.kind == AstKind.NumberExpression and lhs.value == 2 then
		return self:createBitLshift(scope, self:cloneExpression(rhs), 1);
	else
		local choice = math.random(1, 2);
		if choice == 1 then
			local k = math.random(1, 50);
			return Ast.SubExpression(
				Ast.MulExpression(
					self:cloneExpression(lhs),
					Ast.AddExpression(self:cloneExpression(rhs), Ast.NumberExpression(k))
				),
				Ast.MulExpression(self:cloneExpression(lhs), Ast.NumberExpression(k))
			);
		else
			return Ast.MulExpression(self:cloneExpression(lhs), self:cloneExpression(rhs));
		end
	end
end

function MBAObfuscation:transformNegation(scope, rhs)
	local choice = math.random(1, 2);
	
	if choice == 1 then
		local notExpr = self:createBitNot(scope, self:cloneExpression(rhs));
		return Ast.AddExpression(notExpr, Ast.NumberExpression(1));
	else
		return Ast.SubExpression(
			self:createBitXor(scope, self:cloneExpression(rhs), Ast.NegateExpression(Ast.NumberExpression(1))),
			Ast.NegateExpression(Ast.NumberExpression(1))
		);
	end
end

function MBAObfuscation:isSimpleExpression(node)
	return node.kind == AstKind.NumberExpression or
		   node.kind == AstKind.VariableExpression;
end

function MBAObfuscation:apply(ast, pipeline)
	local self2 = self;
	
	visitast(ast, nil, function(node, data)
		if self2.currentDepth >= self2.MaxDepth then
			return;
		end
		
		if math.random() > self2.Probability then
			return;
		end
		
		local scope = data.scope;
		
		if node.kind == AstKind.AddExpression then
			if self2:isSimpleExpression(node.lhs) and self2:isSimpleExpression(node.rhs) then
				self2.currentDepth = self2.currentDepth + 1;
				local result = self2:transformAddition(scope, node.lhs, node.rhs);
				self2.currentDepth = self2.currentDepth - 1;
				return result;
			end
		elseif node.kind == AstKind.SubExpression then
			if self2:isSimpleExpression(node.lhs) and self2:isSimpleExpression(node.rhs) then
				self2.currentDepth = self2.currentDepth + 1;
				local result = self2:transformSubtraction(scope, node.lhs, node.rhs);
				self2.currentDepth = self2.currentDepth - 1;
				return result;
			end
		elseif node.kind == AstKind.MulExpression then
			if self2:isSimpleExpression(node.lhs) and self2:isSimpleExpression(node.rhs) then
				self2.currentDepth = self2.currentDepth + 1;
				local result = self2:transformMultiplication(scope, node.lhs, node.rhs);
				self2.currentDepth = self2.currentDepth - 1;
				return result;
			end
		elseif node.kind == AstKind.NegateExpression then
			if self2:isSimpleExpression(node.rhs) then
				self2.currentDepth = self2.currentDepth + 1;
				local result = self2:transformNegation(scope, node.rhs);
				self2.currentDepth = self2.currentDepth - 1;
				return result;
			end
		end
	end)
	
	return ast;
end

return MBAObfuscation;
