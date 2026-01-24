-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- pipeline.lua
--
-- This Script Provides some configuration presets

return {
    ["Minify"] = {
        -- The default LuaVersion is Lua51
        LuaVersion = "Lua51";
        -- For minifying no VarNamePrefix is applied
        VarNamePrefix = "";
        -- Name Generator for Variables
        NameGenerator = "MangledShuffled";
        -- No pretty printing
        PrettyPrint = false;
        -- Seed is generated based on current time
        Seed = 0;
        -- No obfuscation steps
        Steps = {

        }
    };
    ["Weak"] = {
        -- The default LuaVersion is Lua51
        LuaVersion = "Lua51";
        -- For minifying no VarNamePrefix is applied
        VarNamePrefix = "";
        -- Name Generator for Variables that look like this: IlI1lI1l
        NameGenerator = "MangledShuffled";
        -- No pretty printing
        PrettyPrint = false;
        -- Seed is generated based on current time
        Seed = 0;
        -- Obfuscation steps
        Steps = {
            {
                Name = "Vmify";
                Settings = {
                    
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                }
            },
            {
                Name = "WrapInFunction";
                Settings = {

                }
            },
        }
    };
    ["Medium"] = {
        -- The default LuaVersion is Lua51
        LuaVersion = "Lua51";
        -- For minifying no VarNamePrefix is applied
        VarNamePrefix = "";
        -- Name Generator for Variables
        NameGenerator = "MangledShuffled";
        -- No pretty printing
        PrettyPrint = false;
        -- Seed is generated based on current time
        Seed = 0;
        -- Obfuscation steps
        Steps = {
            {
                Name = "EncryptStrings";
                Settings = {

                };
            },
            {
                Name = "AntiTamper";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "Vmify";
                Settings = {
                    
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = true;
                    LocalWrapperTreshold = 0;
                }
            },
            {
                Name = "NumbersToExpressions";
                Settings = {

                }
            },
            {
                Name = "WrapInFunction";
                Settings = {

                }
            },
        }
    };
    ["Strong"] = {
        -- The default LuaVersion is Lua51
        LuaVersion = "Lua51";
        -- For minifying no VarNamePrefix is applied
        VarNamePrefix = "";
        -- Name Generator for Variables that look like this: IlI1lI1l
        NameGenerator = "MangledShuffled";
        -- No pretty printing
        PrettyPrint = false;
        -- Seed is generated based on current time
        Seed = 0;
        -- Obfuscation steps
        Steps = {
            {
                Name = "Vmify";
                Settings = {
                    
                };
            },
            {
                Name = "EncryptStrings";
                Settings = {

                };
            },
            {
                Name = "AntiTamper";
                Settings = {

                };
            },
            {
                Name = "Vmify";
                Settings = {
                    
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = true;
                    LocalWrapperTreshold = 0;
                }
            },
            {
                Name = "NumbersToExpressions";
                Settings = {

                }
            },
            {
                Name = "WrapInFunction";
                Settings = {

                }
            },
        }
    };
    ["Maximum"] = {
        -- Maximum security with all steps enabled
        LuaVersion = "Lua51";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "MBAObfuscation";
                Settings = {};
            },
            {
                Name = "AdvancedControlFlow";
                Settings = {};
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {};
            },
            {
                Name = "MultiLayerStringEncryption";
                Settings = {};
            },
            {
                Name = "ReferenceHiding";
                Settings = {};
            },
            {
                Name = "DeadCodePolymorphism";
                Settings = {};
            },
            {
                Name = "ControlFlowFlatten";
                Settings = {};
            },
            {
                Name = "OpaquePredicates";
                Settings = {};
            },
            {
                Name = "JunkCode";
                Settings = {};
            },
            {
                Name = "Vmify";
                Settings = {};
            },
            {
                Name = "EncryptStrings";
                Settings = {};
            },
            {
                Name = "StringToBytes";
                Settings = {};
            },
            {
                Name = "CallIndirection";
                Settings = {};
            },
            {
                Name = "AntiTamper";
                Settings = {};
            },
            {
                Name = "Vmify";
                Settings = {};
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = true;
                    LocalWrapperTreshold = 0;
                }
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "ProxifyLocals";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["Performance"] = {
        -- Fast obfuscation with minimal runtime overhead
        LuaVersion = "Lua51";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "EncryptStrings";
                Settings = {};
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = false;
                    LocalWrapperTreshold = 0;
                }
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["LuaU"] = {
        -- Roblox-optimized preset that avoids debug library
        LuaVersion = "LuaU";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "MBAObfuscation";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "AdvancedControlFlow";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "MultiLayerStringEncryption";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "ReferenceHiding";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "DeadCodePolymorphism";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "ControlFlowFlatten";
                Settings = {};
            },
            {
                Name = "OpaquePredicates";
                Settings = {};
            },
            {
                Name = "EncryptStrings";
                Settings = {};
            },
            {
                Name = "CallIndirection";
                Settings = {};
            },
            {
                Name = "AntiTamper";
                Settings = {
                    UseDebug = false;
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = true;
                    LocalWrapperTreshold = 0;
                }
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "ProxifyLocals";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["StringsOnly"] = {
        -- Only string-related obfuscation
        LuaVersion = "Lua51";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "SplitStrings";
                Settings = {};
            },
            {
                Name = "EncryptStrings";
                Settings = {};
            },
            {
                Name = "StringToBytes";
                Settings = {};
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold    = 1;
                    StringsOnly = true;
                    Shuffle     = true;
                    Rotate      = true;
                    LocalWrapperTreshold = 0;
                }
            },
        }
    };
    ["Ultimate2026"] = {
        -- Ultimate protection preset with all advanced steps and double VM
        LuaVersion = "LuaU";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            -- Phase 1: Expression Transformations
            {
                Name = "MBAObfuscation";
                Settings = {
                    Density = 0.7;
                    Depth = 3;
                };
            },
            -- Phase 2: Control Flow
            {
                Name = "AdvancedControlFlow";
                Settings = {
                    UseClosures = true;
                    StateEncoding = true;
                };
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {
                    Density = 0.5;
                    Complexity = 4;
                };
            },
            {
                Name = "DeadCodePolymorphism";
                Settings = {
                    Density = 0.3;
                };
            },
            -- Phase 3: First VM layer
            {
                Name = "Vmify";
                Settings = {};
            },
            -- Phase 4: Strings and references
            {
                Name = "MultiLayerStringEncryption";
                Settings = {
                    Layers = 4;
                    SplitChunks = true;
                };
            },
            {
                Name = "ReferenceHiding";
                Settings = {
                    HideGlobals = true;
                    WrapFunctions = true;
                };
            },
            -- Phase 5: Anti-tamper
            {
                Name = "AntiTamper";
                Settings = {
                    UseDebug = false;
                    SilentCorruption = true;
                    ScatterChecks = true;
                };
            },
            -- Phase 6: Second VM layer
            {
                Name = "Vmify";
                Settings = {};
            },
            -- Phase 7: Finalization
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold = 1;
                    StringsOnly = true;
                    Shuffle = true;
                    Rotate = true;
                };
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "ProxifyLocals";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["Stealth2026"] = {
        -- Stealth preset focused on appearing like legitimate code while protected
        -- Less VM usage, more subtle transformations
        LuaVersion = "LuaU";
        VarNamePrefix = "";
        NameGenerator = "Dictionary";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "MBAObfuscation";
                Settings = {
                    Density = 0.3;
                    Depth = 2;
                };
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {
                    Density = 0.2;
                    Complexity = 2;
                };
            },
            {
                Name = "DeadCodePolymorphism";
                Settings = {
                    Density = 0.4;
                };
            },
            {
                Name = "MultiLayerStringEncryption";
                Settings = {
                    Layers = 2;
                    SplitChunks = false;
                };
            },
            {
                Name = "ReferenceHiding";
                Settings = {
                    HideGlobals = true;
                    WrapFunctions = false;
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold = 1;
                    StringsOnly = true;
                    Shuffle = true;
                    Rotate = false;
                };
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["Best"] = {
        -- THE ULTIMATE PRESET: Maximum security + Maximum compatibility
        -- Combines all advanced obfuscation with full LuaU/Roblox support
        -- Compatible with: Delta, Velocity, Xeno, Wave, Synapse Z, Fluxus, Solara, etc.
        LuaVersion = "LuaU";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            -- Phase 1: Expression obfuscation (MBA)
            {
                Name = "MBAObfuscation";
                Settings = {
                    Probability = 0.6;
                    MaxDepth = 3;
                    UseBit32 = true;
                };
            },
            -- Phase 2: Control flow destruction
            {
                Name = "AdvancedControlFlow";
                Settings = {
                    MaxBlockSize = 3;
                    FlattenProbability = 0.8;
                    DeadClones = 4;
                };
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {
                    Probability = 0.5;
                    Complexity = 4;
                };
            },
            {
                Name = "DeadCodePolymorphism";
                Settings = {
                    Density = 0.4;
                    MaxJunkOps = 4;
                };
            },
            -- Phase 3: First VM layer
            {
                Name = "Vmify";
                Settings = {};
            },
            -- Phase 4: String protection (4 layers)
            {
                Name = "MultiLayerStringEncryption";
                Settings = {
                    Layers = 4;
                    SplitChunks = true;
                    PolymorphicDecryptor = true;
                };
            },
            -- Phase 5: Reference hiding
            {
                Name = "ReferenceHiding";
                Settings = {
                    HideGlobals = true;
                    WrapFunctions = true;
                    IndirectAccess = true;
                };
            },
            -- Phase 6: Call obfuscation
            {
                Name = "CallIndirection";
                Settings = {
                    Threshold = 0.7;
                };
            },
            -- Phase 7: Anti-tamper (LuaU safe)
            {
                Name = "AntiTamper";
                Settings = {
                    UseDebug = false;
                    LuaUSafe = true;
                    SilentCorruption = true;
                    ScatterChecks = true;
                    CheckCount = 8;
                    EnvironmentValidation = true;
                    MetamethodValidation = true;
                };
            },
            -- Phase 8: Second VM layer (double protection)
            {
                Name = "Vmify";
                Settings = {};
            },
            -- Phase 9: Finalization
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold = 1;
                    StringsOnly = true;
                    Shuffle = true;
                    Rotate = true;
                    LocalWrapperTreshold = 0;
                };
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "ProxifyLocals";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
    ["Performance2026"] = {
        -- Maximum protection with minimum runtime overhead
        -- No heavy VM, but strong string and control flow protection
        LuaVersion = "LuaU";
        VarNamePrefix = "";
        NameGenerator = "MangledShuffled";
        PrettyPrint = false;
        Seed = 0;
        Steps = {
            {
                Name = "MBAObfuscation";
                Settings = {
                    Density = 0.4;
                    Depth = 2;
                };
            },
            {
                Name = "AdvancedControlFlow";
                Settings = {
                    UseClosures = false;
                    StateEncoding = true;
                };
            },
            {
                Name = "AdvancedOpaquePredicates";
                Settings = {
                    Density = 0.3;
                    Complexity = 2;
                };
            },
            {
                Name = "MultiLayerStringEncryption";
                Settings = {
                    Layers = 2;
                    SplitChunks = false;
                };
            },
            {
                Name = "ReferenceHiding";
                Settings = {
                    HideGlobals = true;
                    WrapFunctions = false;
                };
            },
            {
                Name = "AntiTamper";
                Settings = {
                    UseDebug = false;
                    SilentCorruption = true;
                    ScatterChecks = false;
                };
            },
            {
                Name = "ConstantArray";
                Settings = {
                    Treshold = 1;
                    StringsOnly = true;
                    Shuffle = true;
                    Rotate = true;
                };
            },
            {
                Name = "NumbersToExpressions";
                Settings = {};
            },
            {
                Name = "ProxifyLocals";
                Settings = {};
            },
            {
                Name = "WrapInFunction";
                Settings = {};
            },
        }
    };
}
