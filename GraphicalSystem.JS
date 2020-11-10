// GraphicalSystem.JS - файл с классом GraphDrawer для рисования графиков функций
// Проект Graphite 5.0
// TrollingCont
// 01.03.2017

const GS_INVALID_CONSTRUCTOR_PARAMS = 10;

class GraphDrawer
{
	/**
	* @constructor
	* @param {canvasContext} canvasContext: контекст HTML5-элемента canvas, возвращаемый функцией getContext("2d")
	* @param {number} startX: X-координата начала области рисования относительно начала canvas
	* @param {number} startY: Y-координата начала области рисования относительно начала canvas
	* @param {number} width: ширина области рисования
	* @param {number} height: высота области рисования
	* @param {number} offsetX: X-координата нуля Декартовой системы координат относительно начала области рисования
	* @param {number} offsetY: Y-координата нуля Декартовой системы координат относительно начала области рисования
	* @param {number} scaleX: единичный масштаб по оси X
	* @param {number} scaleY: единичный масштаб по оси Y
	*/
	constructor(canvasContext, startX, startY, width, height, offsetX, offsetY, scaleX, scaleY)
	{
		if (width <= 0 || height <= 0 || scaleX <= 0 || scaleY <= 0)
		{
			this.errorlevel = GS_INVALID_CONSTRUCTOR_PARAMS;
			return;
		}
		this.CTX = canvasContext;
		this.startX = startX;
		this.startY = startY;
		this.width = width;
		this.height = height;
		this.maxX = this.startX + this.width;
		this.maxY = this.startY + this.height;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.scaleX = scaleX;
		this.scaleY = scaleY;
		this.functionsArray = [];
		this.toBeDrawn = [];
		this.redrawAll = false;
		this.startPoint = { x: null, y: null };
		this.grid = null;
		this.basePxStep = 2.8;
		this.scaleXDrawn = null;
		this.scaleYDrawn = null;
		this.cacheVal = null;
		this.cacheVar = null;
		this.errorlevel = 0;
		this.areaBackground = "#FFFFFF";
	}
	
	/**
	* Создаёт новый график
	* @param {functionObject} объект функции/графика
	* functionObject {
		parserObject: { func, varName, useRadians }  объект парсера
		color  цвет в допустимом CSS формате
		begin  начало диапазона построения графика
		end  конец диапазона построения графика
		isDerivative  false - график функции, true - производной
		type  false - y(x), true - x(y)
		visibility  true - видимый, false - нет
	} 
	*/
	createGraph(functionObject)
	{
		if (this.errorlevel || functionObject.parserObject.errorlevel || functionObject.begin >= functionObject.end) return false;
		
		this.functionsArray.push(functionObject);
		if (functionObject.visibility) this.toBeDrawn.push(this.functionsArray.length - 1);
		return true;
	}
	
	/**
	* Перерисовывает область рисования
	* Перерисовывается только то, что изменилось с предыдущего вызова redraw()
	*/
	redraw()
	{
		if (this.errorlevel) return false;
		
		let startTime = performance.now();
		let redrawnCount = 0;
		if (this.redrawAll)
		{
			this.scaleXDrawn = this.scaleX;
			this.scaleYDrawn = this.scaleY;
			this.interClearArea();
			if (this.grid) this.interDrawGrid(this.grid);
			for (var i = 0; i < this.functionsArray.length; ++i)
			{
				if (this.functionsArray[i].visibility)
				{
					 this.interDrawGraph(this.functionsArray[i]);
					 ++redrawnCount;
				}
			}
		}
		else
		{
			for (var i = 0; i < this.toBeDrawn.length; ++i)
			{
				if (this.functionsArray[this.toBeDrawn[i]].visibility)
				{
					this.interDrawGraph(this.functionsArray[this.toBeDrawn[i]]);
					++redrawnCount;
				}
			}
		}
		console.log("redraw :: redrawn graphs = %d; run time = %d ms", redrawnCount, performance.now() - startTime);
		this.redrawAll = false;
		this.toBeDrawn.length = 0;
	}
	
	/**
	* Возвращает флаг видимости графика
	* @return {number} флаг видимости
	* @param {number} индекс графика
	*/
	isVisible(index)
	{
		if (typeof index != "number" || index < 0 || index >= this.functionsArray.length) return -1;
		return +this.functionsArray[index].visibility;
	}
	
	/**
	* Установить видимость для отдельного графика
	* @param {number} индекс графика
	* @param {boolean} флаг видимости
	*/
	setGraphVisibility(index, visibilityFlag)
	{
		if (this.errorlevel) return false;
		
		if (typeof index == "number" && index >= 0 && index < this.functionsArray.length && typeof visibilityFlag == "boolean")
		{
			if (this.functionsArray[index].visibility != visibilityFlag)
			{
				if (!visibilityFlag) this.redrawAll = true;
				else this.toBeDrawn.push(index);
			}
			this.functionsArray[index].visibility = visibilityFlag;
			return true;
		}
		return false;
	}
	
	/**
	* Создаёт сетку
	* @param {number} ширина линий коорднатной сетки
	* @param {string} цвет линий координатной сетки
	* @param {number} ширина линий, лежащих на нулевых осях
	* @param {string} цвет линий, лежащих на нулевых осях
	*/
	createGrid(linesWidth, linesColor, mainLinesWidth, mainLinesColor)
	{
		if (this.errorlevel) return false;
		
		if (typeof linesWidth == "number" && linesWidth > 0 && typeof mainLinesWidth == "number" && mainLinesWidth > 0 && typeof linesColor == "string" && typeof mainLinesColor == "string")
		{
			this.grid = new Grid(linesWidth, linesColor, mainLinesWidth, mainLinesColor);
			this.redrawAll = true;
			return true;
		}
		return false;
	}
	
	/**
	* Очистить список графиков
	*/
	clearGraphList()
	{
		if (this.errorlevel) return false;
		
		this.functionsArray.length = 0;
		this.redrawAll = true;
		return true;
	}
	
	/**
	* Удалить график
	* @param {number} индекс удаляемого графика
	*/
	deleteGraph(index)
	{
		if (typeof index != "number" || index < 0 || index >= this.functionsArray.length) return false;
		
		for (let i = index; i < this.functionsArray.length - 1; ++i) this.functionsArray[i] = this.functionsArray[i+1].copy();
		--this.functionsArray.length;
		this.redrawAll = true;
		return true;
	}
	
	/**
	* Устанавливает фоновый цвет
	* @param {string} цвет в виде строки в любом допустимом CSS-формате
	*/
	setBackgroundColor(color)
	{
		this.areaBackground = color;
		this.redrawAll = true;
	}
	
	/**
	* Установить единичный масштаб по оси X
	* @param {number} Новый единичный масштаб
	*/
	setScaleX(scale)
	{
		if (this.errorlevel) return false;
		
		if (typeof scale == "number" && scale > 0)
		{
			this.redrawAll = (scale != this.scaleXDrawn);
			this.scaleX = scale;
			return true;
		}
		return false;
	}
	
	/**
	* Установить единичный масштаб по оси Y
	* @param {number} Новый единичный масштаб
	*/
	setScaleY(scale)
	{
		if (this.errorlevel) return false;
		
		if (typeof scale == "number" && scale > 0)
		{
			this.redrawAll = (scale != this.scaleYDrawn);
			this.scaleY = scale;
			return true;
		}
		return false;
	}
	
	/**
	* Возвращает количество графиков
	*/
	getLength()
	{	
		return this.functionsArray.length;
	}
	
	/**
	* Возвращает код ошибки. 0 - если ошибок нет
	* @return {number} код ошибки
	*/
	getErrorlevel()
	{
		return this.errorlevel;
	}
	
	/**
	* @return {number} Возвращает единичный масштаб по оси X
	*/
	getScaleX()
	{
		return this.scaleX;
	}
	
	/**
	* @return {number} Возвращает единичный масштаб по оси Y
	*/
	getScaleY()
	{
		return this.scaleY;
	}
	
	/**
	* @return {number} Возвращает ширину области рисования
	*/
	getAreaWidth()
	{
		return this.width;
	}
	
	/**
	* @return {number} Возвращает высоту области рисования
	*/
	
	getAreaHeight()
	{
		return this.height;
	}
	
	/* Внутренние функции, которые не должны вызываться напрямую кодом вне этого класса */
	
	// Очистить область рисования
	interClearArea()
	{
		this.CTX.fillStyle = this.areaBackground;
		this.CTX.fillRect(this.startX, this.startY, this.width, this.height);
	}
	
	// Нарисовать сетку
	interDrawGrid(grid)
	{	
		this.CTX.beginPath();
		this.CTX.lineWidth = grid.lineWidth;
		this.CTX.strokeStyle = grid.lineColor;
		let xLineStart = this.startX + this.offsetX;
		for (let i = xLineStart - this.scaleX; i >= this.startX; i -= this.scaleX)
		{
			this.CTX.moveTo(i, this.startY);
			this.CTX.lineTo(i, this.startY + this.height);
		}
		for (let i = xLineStart + this.scaleX; i <= this.startX + this.width; i += this.scaleX)
		{
			this.CTX.moveTo(i, this.startY);
			this.CTX.lineTo(i, this.startY + this.height);
		}
		let yLineStart = this.startY + this.offsetY;
		for (let i = yLineStart - this.scaleY; i >= this.startY; i -= this.scaleY)
		{
			this.CTX.moveTo(this.startX, i);
			this.CTX.lineTo(this.startX + this.width, i);
		}
		for (let i = yLineStart + this.scaleY; i <= this.startY + this.height; i += this.scaleY)
		{
			this.CTX.moveTo(this.startX, i);
			this.CTX.lineTo(this.startX + this.width, i);
		}
		this.CTX.stroke();
		this.CTX.beginPath();
		this.CTX.lineWidth = grid.mainLineWidth;
		this.CTX.strokeStyle = grid.mainLineColor;	
		this.CTX.moveTo(this.startX + this.offsetX, this.startY + this.height);
		this.CTX.lineTo(this.startX + this.offsetX, this.startY);
		let arrowVertX = this.width * 0.005;
		let arrowVertY = this.height * 0.02;
		this.CTX.lineTo(this.startX + this.offsetX - arrowVertX, this.startY + arrowVertY);
		this.CTX.moveTo(this.startX + this.offsetX, this.startY);
		this.CTX.lineTo(this.startX + this.offsetX + arrowVertX, this.startY + arrowVertY);
		this.CTX.moveTo(this.startX, this.startY + this.offsetY);
		this.CTX.lineTo(this.startX + this.width, this.startY + this.offsetY);
		let arrowHorX = this.width * 0.02;
		let arrowHorY = this.height * 0.005;
		this.CTX.lineTo(this.startX + this.width - arrowHorX, this.startY + this.offsetY - arrowHorY);
		this.CTX.moveTo(this.startX + this.width, this.startY + this.offsetY);
		this.CTX.lineTo(this.startX + this.width - arrowHorX, this.startY + this.offsetY + arrowHorY);
		this.CTX.stroke();
	}
	
	// Вычислить параметры, необходимые для построения графика
	interGetDrawingParams(functionObject)
	{
		let ret = { };
		ret.fast = (functionObject.type) ? (2.8 / this.scaleY) : (2.8 / this.scaleX);
		ret.precise = 0.5 * ret.fast;
		ret.HQ = 0.005;
		let minBegin = -this.offsetX / this.scaleX;
		let maxEnd = (this.width - this.offsetX) / this.scaleX;
		ret.rangeBegin = functionObject.begin;
		ret.rangeEnd = functionObject.end;
		if (!functionObject.type)
		{
			ret.minFuncValue = (this.offsetY - this.height) / this.scaleY;
			ret.maxFuncValue = this.offsetY / this.scaleY;
		}
		else
		{
			ret.minFuncValue = -this.offsetX / this.scaleX;
			ret.maxFuncValue = (this.width - this.offsetX) / this.scaleX;
		}
		if (functionObject.begin == undefined && functionObject.end == undefined)
		{
			if (!functionObject.type)
			{
				ret.rangeBegin = minBegin;
				ret.rangeEnd = maxEnd;
			}
			else
			{
				ret.rangeBegin = (this.offsetY - this.height) / this.scaleY;
				ret.rangeEnd = this.offsetY / this.scaleY;
			}
		}
		else
		{
			if (!functionObject.type)
			{
				if (ret.rangeBegin < minBegin) ret.rangeBegin = minBegin;
				if (ret.rangeEnd > maxEnd) ret.rangeEnd = maxEnd;
			}
			else
			{
				let minBeginY = (this.offset - this.height) / this.scaleY;
				if (ret.rangeBegin < minBeginY) ret.rangeBegin = minBeginY;
				let maxEndY = (this.offset - this.startY) / this.scaleY;
				if (ret.rangeEnd > maxEndY) rangeEnd = maxEndY;
			}
		}
		return ret;
	}
	
	// Получение значения производной
	interGetDerivativeValue(po, val, val2)
	{
		// С кэшированием
		if (this.cacheVal == null || this.cacheVar != val)
		{
			this.cacheVal = po.getFunctionValue(val2);
			this.cacheVar = val2;
			return (this.cacheVal - po.getFunctionValue(val)) / (val2 - val);
		}
		else
		{
			let cacheExtra = po.getFunctionValue(val2);
			let a = (cacheExtra - this.cacheVal) / (val2 - val);
			this.cacheVal = cacheExtra;
			return a;
		}
	}
	
	// Построить график функции
	interDrawGraph(functionObject)
	{
		this.CTX.beginPath();
		this.CTX.lineWidth = 2;
		this.CTX.strokeStyle = functionObject.color;
		let extraParams = this.interGetDrawingParams(functionObject);
		let step = extraParams.HQ;
		let opened = false;
		let cx, cy;
		let v, vold = NaN;
		
		for (let i = extraParams.rangeBegin; i <= extraParams.rangeEnd; )
		{
			
			// НАДО ЧТО-НИБУДЬ СДЕЛАТЬ!!!
			if (!functionObject.isDerivative) v = functionObject.parserObject.getFunctionValue(i);
			else v = this.interGetDerivativeValue(functionObject.parserObject, i, i + step);
			if (isNaN(v))
			{
				opened = false;
				i += step;
				continue;
			}
			if (!functionObject.type)
			{
				cx = i * this.scaleX + this.offsetX + this.startX;
				cy = -v * this.scaleY + this.offsetY + this.startY;
			}
			else
			{
				cx = v * this.scaleX + this.offsetX + this.startX;
				cy = -i * this.scaleY + this.offsetY + this.startY;
			}
			if (!opened)
			{
				opened = true;
				this.CTX.moveTo(cx, cy);
				vold = v;
			}
			else
			{
				let Delta = Math.abs(vold - v) / step;
				if (Delta < 3.73) step = extraParams.fast;
				else if (Delta < 11.43) step = extraParams.precise;
				else step = extraParams.HQ;
				if (Math.abs(vold - v) <= 20) this.CTX.lineTo(cx, cy);
				else this.CTX.moveTo(cx, cy);
				vold = v;
			}
			i += step;
		}
		this.CTX.stroke();
	}
}

// FunctionObject - вспомогательный класс-структура, хранящий информацию о графике
class FunctionObject
{
	constructor(parserObject, color, begin, end, isDerivative = false, type = false, visibility = true)
	{
		this.parserObject = parserObject.copy();
		this.color = color;
		this.begin = begin;
		this.end = end;
		this.isDerivative = isDerivative;
		this.type = type;
		this.visibility = visibility;
	}

	copy()
	{
		let copied = {};
		for (var prop in this)
		{
			if (prop == "parserObject")
			{
				copied[prop] = this[prop].copy();
				continue;
			}
			copied[prop] = this[prop];
		}
		copied.copy = this.copy;
		return copied;
	}
}

// Grid - вспомогательный класс структура, хранящий информацию о сетке
class Grid
{
	constructor(lWidth, lColor, mlWidth, mlColor)
	{
		this.lineWidth = lWidth;
		this.lineColor = lColor;
		this.mainLineWidth = mlWidth;
		this.mainLineColor = mlColor;
	}
}