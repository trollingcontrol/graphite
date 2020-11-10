// Parser - класс для вычисления значения математических функций
// Версия парсера 5.0
// TrollingCont
// 15.01.2017

// Коды ошибок парсера
const ERR_UNKNOWN_CHAR =           200;
const ERR_PAIR_BRACKET_NOT_FOUND = 201;
const ERR_UNKNOWN_ACTION_FLAG =    202;
const ERR_NO_FUNCTION_ARGUMENT =   203;
const ERR_WRONG_ROOT_FUNC =        204;
const ERR_EMPTY_FUNC =             205;

// Коды флагов парсера
const NOT = 0;
const MUL = 1;
const DIV = 2;

// Коды математических функций
const SIN =  128; // sin
const COS =  129; // cos
const TAN =  130; // tg, tan
const COT =  131; // ctg, cot
const SEC =  132; // sec
const CSC =  133; // cosec, csc
const ASIN = 134; // arcsin, asin
const ACOS = 135; // arccos, acos
const ATAN = 136; // arctg, atan
const ACOT = 137; // arcctg, acot
const ASEC = 138; // arcsec, asec
const ACSC = 139; // arccosec, acsc
const SQRT = 140; // sqrt
const ABS =  141; // abs
const LN =   142; // ln
const EXP =  143; // exp
const ROOT = 144; // rt, root
const RAND = 145; // rand

// Основной класс Parser
// О да, где ты ещё увидишь комментарии на русском! :)
class Parser
{
	/**
	* @costructor
	* @param {string} функция, заданная в виде строки
	* @param {string} имя переменной - строка из одного символа
	* @param {boolean} true - радианная мера, false - градусная
	*/
	constructor(Func, varName, useRadians)
	{
		this.unhandledFunc = Func;
		this.varName = varName;
		this.radFlag = useRadians;
		this.errorlevel = 0;
		this.compiled = [];
		this.interHandleFuncText();
	}
	
	/**
	* Возвращает копию объекта
	* @return {Parser} копия объекта
	*/
	copy()
	{
		var copied = {};
		for (var prop in this)
		{
			if (prop == "compiled")
			{
				copied.compiled = [];
				for (var i = 0; i < this.compiled.length; ++i) copied.compiled.push(this.compiled[i]);
				continue;
			}
			copied[prop] = this[prop];
		}
		copied.copy = this.copy;
		copied.getFunctionValue = this.getFunctionValue;
		copied.getErrorlevel = this.getErrorlevel;
		copied.interHandleFuncText = this.interHandleFuncText;
		copied.interCompileFunc = this.interCompileFunc;
		copied.interParseCompiled = this.interParseCompiled;
		return copied;
	}
	
	/**
	* Возвращает значение математической функции от данного значения переменной
	* @param {number} значение переменной
	*/
	getFunctionValue(argument)
	{
		if (this.errorlevel) return undefined;
		return this.interParseCompiled(argument, 0);
	}
	
	/**
	* Возвращает код ошибки, нуль в случае отсутствия ошибок
	* @return {number} код ошибки
	*/
	getErrorlevel()
	{
		return this.errorlevel;
	}
	
	// interHandleFuncText - внутренняя функция, производящая обработку текста функции,
	// приводящая её в пригодный для обработки парсером (синтаксическим анализатором) вид
	interHandleFuncText()
	{
		let tmpFunc = "";
		for (var i = 0; i < this.unhandledFunc.length; ++i)
		{
			if (this.unhandledFunc[i] == ' ') continue;
			else if (this.unhandledFunc[i] >= 'A' && this.unhandledFunc[i] <= 'Z') tmpFunc += this.unhandledFunc[i].toLowerCase();
			else tmpFunc += this.unhandledFunc[i];
		}
		if (!tmpFunc.length)
		{
			this.errorlevel = ERR_EMPTY_FUNC;
			return;
		}
		
		this.func = "";
		var i = 0;
		while (i < tmpFunc.length)
		{
			if (tmpFunc[i] == this.varName && tmpFunc[i+1] == '(')
			{
				this.func += this.varName + '*';
			}
			else if (this.interIsDigit(tmpFunc[i]))
			{
				this.func += tmpFunc[i];
				if ((tmpFunc[i+1] >= 'a' && tmpFunc[i+1] <= 'z' && tmpFunc[i+1] != 'e') || tmpFunc[i+1] == '(') this.func += '*';
				else if (tmpFunc[i+1] == 'e')
				{
					if (this.interIsDigit(tmpFunc[i+2]) || tmpFunc[i+2] == '-') this.func += 'e';
					else this.func += "*2.7182818284590452";
					i += 2;
					continue;
				}
			}
			else if (tmpFunc[i] == ')' && tmpFunc[i+1] == '(')
			{
				this.func += ")*";
			}
			else if (tmpFunc[i] == 'e')
			{
				if (tmpFunc[i+1] != 'c' && tmpFunc.indexOf("exp", i) != i) this.func += "2.7182818284590452";
				else this.func += 'e';
			}
			else if (tmpFunc.indexOf("pi", i) == i)
			{
				this.func += "3.1415926535897932";
				i += 2;
				continue;
			}
			else this.func += tmpFunc[i];
			++i;
		}
		this.interCompileFunc(this.func, this.compiled);
	}
	
	// interCompileFunc - внутренняя функция, выполняющая компиляюцию математической функции
	interCompileFunc(func, compiledFunc)
	{
		var Action = NOT, Trig = NOT, Deg = false;
		var i = 0;
		while (i < func.length && !this.errorlevel)
		{
			if (this.interIsDigit(func[i]))
			{
				var T = parseFloat(func.slice(i));
				if (!Deg)
				{
					compiledFunc.push(16);
					compiledFunc.push(T);
				}
				else
				{
					compiledFunc.push(17);
					compiledFunc.push(T);
					Deg = false;
				}
				i += this.interGetNumLength(func.slice(i));
				continue;
			}
			if (func[i] == this.varName)
			{
				if (!Deg) compiledFunc.push(18);
				else
				{
					compiledFunc.push(19);
					Deg = false;
				}
				++i;
				continue;
			}
			if (func[i] == '^')
			{
				Deg = true;
				++i;
				continue;
			}
			if (func[i] == '*' || func[i] == '/')
			{
				switch (Action)
				{
					case NOT: compiledFunc.push(22); break;
					case MUL: compiledFunc.push(23); break;
					case DIV: compiledFunc.push(24); break;
					default: this.errorlevel = ERR_UNKNOWN_ACTION_FLAG;
				}
				compiledFunc.push(26);
				if (func[i] == '*') Action = MUL;
				else Action = DIV;
				++i;
				continue;
			}
			if (func[i] == '+')
			{
				if (func[i - 1] != '*' && func[i - 1] != '/' && func[i - 1] != '+' && func[i - 1] != '-')
				{
					switch (Action)
					{
						case NOT: compiledFunc.push(22); break;
						case MUL: compiledFunc.push(23); break;
						case DIV: compiledFunc.push(24); break;
					}
					compiledFunc.push(25);
					compiledFunc.push(29);
					compiledFunc.push(26);
					Action = NOT;
				}
				++i;
				continue;
			}
			if (func[i] == '-')
			{
				if (func[i - 1] != '*' && func[i - 1] != '/' && func[i - 1] != '+' && func[i - 1] != '-')
				{
					switch (Action)
					{
						case NOT: compiledFunc.push(22); break;
						case MUL: compiledFunc.push(23); break;
						case DIV: compiledFunc.push(24); break;
					}
					compiledFunc.push(25);
					compiledFunc.push(27);
					compiledFunc.push(26);
					Action = MUL;
				}
				else
				{
					if (Action == NOT)
					{
						compiledFunc.push(27);
						Action = MUL;
					}
					else compiledFunc.push(28);
				}
				++i;
				continue;
			}
			if (func[i] == '(')
			{
				var Brend = this.interGetPairBracket(func.slice(i)) + i;
				if (isNaN(Brend))
				{
					this.errorlevel = ERR_PAIR_BRACKET_NOT_FOUND;
					break;
				}
				compiledFunc.push(20);
				compiledFunc.push(+Deg);
				var PArray = [];
				this.interCompileFunc(func.slice(i + 1, Brend), PArray);
				if (this.errorlevel) break;
				compiledFunc.push(PArray.length + 3);
				while (PArray.length) compiledFunc.push(PArray.shift());
				if (Deg) Deg = false;
				i = Brend + 1;
				continue;
			}
			if (func[i] >= 'a' && func[i] <= 'z' && func[i] != this.varName)
			{
				if (func.indexOf("sin", i) == i) { Trig = SIN; i += 3; }
				else if (func.indexOf("cosec", i) == i) { Trig = CSC; i += 5; }
				else if (func.indexOf("cos", i) == i) { Trig = COS; i += 3; }
				else if (func.indexOf("tg", i) == i) { Trig = TAN; i += 2; }
				else if (func.indexOf("tan", i) == i) { Trig = TAN; i += 3; }
				else if (func.indexOf("ctg", i) == i) { Trig = COT; i += 3; }
				else if (func.indexOf("cot", i) == i) { Trig = COT; i += 3; }
				else if (func.indexOf("sec", i) == i) { Trig = SEC; i += 3; }
				else if (func.indexOf("csc", i) == i) { Trig = CSC; i += 3; }
				else if (func.indexOf("arcsin", i) == i) { Trig = ASIN; i += 6; }
				else if (func.indexOf("asin", i) == i) { Trig = ASIN; i += 4; }
				else if (func.indexOf("arccosec", i) == i) { Trig = ACSC; i += 8; }
				else if (func.indexOf("arccos", i) == i) { Trig = ACOS; i += 6; }
				else if (func.indexOf("acos", i) == i) { Trig = ACOS; i += 4; }
				else if (func.indexOf("arctg", i) == i) { Trig = ATAN; i += 5; }
				else if (func.indexOf("atan", i) == i) { Trig = ATAN; i += 4; }
				else if (func.indexOf("arcctg", i) == i) { Trig = ACOT; i += 6; }
				else if (func.indexOf("acot", i) == i) { Trig = ACOT; i += 4; }
				else if (func.indexOf("arcsec", i) == i) { Trig = ASEC; i += 6; }
				else if (func.indexOf("asec", i) == i) { Trig = ASEC; i += 4; }
				else if (func.indexOf("acsc", i) == i) { Trig = ACSC; i += 4; }
				else if (func.indexOf("sqrt", i) == i) { Trig = SQRT; i += 4; }
				else if (func.indexOf("abs", i) == i) { Trig = ABS; i += 3; }
				else if (func.indexOf("ln", i) == i) { Trig = LN; i += 2; }
				else if (func.indexOf("exp", i) == i) { Trig = EXP; i += 3; }
				else if (func.indexOf("rt", i) == i) { Trig = ROOT; i += 2; }
				else if (func.indexOf("root", i) == i) { Trig = ROOT; i += 4; }
				else if (func.indexOf("rand", i) == i) { Trig = RAND; i += 4; }
				else
				{
					this.errorlevel = ERR_UNKNOWN_CHAR;
					break;
				} 
				if (Trig != ROOT)
				{
					compiledFunc.push(21);
					compiledFunc.push(Trig);
					compiledFunc.push(+Deg);
				}
				if (Trig == ROOT)
				{
					compiledFunc.push(30);
					compiledFunc.push(+Deg);
					var RO = parseInt(func.slice(i));
					if (isNaN(RO))
					{
						this.errorlevel = ERR_WRONG_ROOT_FUNC;
						break;
					}
					i += this.interGetNumLength(func.slice(i)) + 1;
					if (func[i] != '(')
					{
						this.errorlevel = ERR_NO_FUNCTION_ARGUMENT;
						break;
					}
					var Brend = this.interGetPairBracket(func.slice(i)) + i;
					if (isNaN(Brend))
					{
						this.errorlevel = ERR_PAIR_BRACKET_NOT_FOUND;
						break;
					}
					var CRoot = [];
					this.interCompileFunc(func.slice(i + 1, Brend), CRoot);
					if (this.errorlevel) break;
					compiledFunc.push(CRoot.length + 4);
					compiledFunc.push(RO);
					while (CRoot.length) compiledFunc.push(CRoot.shift());
					if (Deg) Deg = false;
					i = Brend + 1;
					continue;
				}
				var Brend = this.interGetPairBracket(func.slice(i)) + i;
				if (isNaN(Brend))
				{
					this.errorlevel = ERR_PAIR_BRACKET_NOT_FOUND;
					break;
				}
				var FArray = [];
				this.interCompileFunc(func.slice(i + 1, Brend), FArray);			
				if (this.errorlevel) break;
				compiledFunc.push(FArray.length + 4);
				while (FArray.length) compiledFunc.push(FArray.shift());
				i = Brend + 1;
				Trig = NOT;
				continue;
			}
			this.errorlevel = ERR_UNKNOWN_CHAR;
			break;
		}
		switch (Action)
		{
			case NOT: compiledFunc.push(22); break;
			case MUL: compiledFunc.push(23); break;
			case DIV: compiledFunc.push(24); break;
			default: this.errorlevel = ERR_UNKNOWN_ACTION_FLAG;
		}
		compiledFunc.push(25);
		compiledFunc.push(0);
	}
	
	// interParseCompiled - внутренняя функция, обрабатывающая скомпилированную математическую функцию и
	// возвращающая её значение от заданного в параметре значения переменной
	interParseCompiled(varValue, startPos)
	{	
		var Ans = 0, Tempans = 0, Buf = 0;
		var i = startPos;
		while (i < this.compiled.length)
		{
			switch (this.compiled[i])
			{
				case  0: return +Ans.toFixed(7); break;
				case 16: Buf = this.compiled[i+1]; i+=2; break;
				case 17: Buf = Math.pow(Buf, this.compiled[i+1]); i+=2; break;
				case 18: Buf = varValue; ++i; break;
				case 19: Buf = Math.pow(Buf, varValue); ++i; break;
				case 20:
				{
					var T = this.interParseCompiled(varValue, i + 3);
					if (!this.compiled[i + 1]) Buf = T;
					else Buf = Math.pow(Buf, T);
					i += this.compiled[i + 2];
				}
				break;
				case 21:
				{
					var T = this.interParseCompiled(varValue, i + 4);
					if (!this.radFlag && this.compiled[i + 1] >= 128 && this.compiled[i + 1] <= 133) T /= 57.29577951;
					var Z;
					switch (this.compiled[i + 1])
					{
						case SIN: Z = Math.sin(T); break;
						case COS: Z = Math.cos(T); break;
						case TAN: Z = Math.tan(T); break;
						case COT: Z = 1 / Math.tan(T); break;
						case SEC: Z = 1 / Math.cos(T); break;
						case CSC: Z = 1 / Math.sin(T); break;
						case ASIN: Z = Math.asin(T); break;
						case ACOS: Z = Math.acos(T); break;
						case ATAN: Z = Math.atan(T); break;
						case ACOT: Z = 1.570796327 - Math.atan(T); break;
						case ASEC: Z = Math.acos(1 / T); break;
						case ACSC: Z = Math.asin(1 / T); break;
						case SQRT: Z = Math.sqrt(T); break;
						case ABS: Z = Math.abs(T); break;
						case LN: Z = Math.log(T); break;
						case EXP: Z = Math.pow(2.71828182, T); break;
						case RAND: Z = Math.random() * T; break;
					}
					if (!this.radFlag && this.compiled[i + 1] >= 134 && this.compiled[i + 1] <= 139) Z *= 57.29577951;
					if (!this.compiled[i + 2]) Buf = Z;
					else Buf = Math.pow(Buf, Z);
					i += this.compiled[i + 3];
				}
				break;
				case 22: Tempans = Buf; ++i; break;
				case 23: Tempans *= Buf; ++i; break;
				case 24: Tempans /= Buf; ++i; break;
				case 25: Ans += Tempans; ++i; break;
				case 26: Buf = 0; ++i; break;
				case 27: Tempans = -1; ++i; break;
				case 28: Tempans *= -1; ++i; break;
				case 29: Tempans = 0; ++i; break;
				case 30:
				{
					var E = this.interParseCompiled(varValue, i + 4);
					if (!this.compiled[i + 1]) Buf = Math.pow(E, 1 / this.compiled[i + 3]);
					else Buf = Math.pow(Buf, Math.pow(E, 1 / this.compiled[i + 3]));
					i += this.compiled[i + 2];
				}
				break;
				default: console.log("interParseCompiled: код " + this.compiled[i] + " не определён"); return;
			}
		}
	}
	
	// interIsDigit - внутренняя функция, определяющая, является ли символ цифрой
	interIsDigit(Char)
	{
		if (Char >= '0' && Char <= '9') return true;
		return false;
	}
	
	// interGetNumLength - внутренняя функция, возвращающая длину числа
	interGetNumLength(Str)
	{
		var i;
		for (i = 0; Str[i] >= '0' && Str[i] <= '9'; ++i);
		if (Str[i] == '.')
		{
			++i;
			for (; Str[i] >= '0' && Str[i] <= '9'; ++i);
		}
		if (Str[i] == 'e')
		{
			++i;
			if (Str[i] == '-') ++i;
			for (; Str[i] >= '0' && Str[i] <= '9'; ++i);
		}
		return i;
	}
	
	// interGetNumLength - внутренняя функция, находящая парную закрывающую скобку к той, с которой начинается поданная на вход строка
	interGetPairBracket(Func)
	{
		var BrCount = 0;
		for (var i = 0; i < Func.length; ++i)
		{
			if (Func[i] == '(') ++BrCount;
			if (Func[i] == ')')
			{
				--BrCount;
				if (!BrCount) return i;
			}
		}
		return NaN;
	}
}