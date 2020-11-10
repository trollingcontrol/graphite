// Main.JS - главный файл, обработчик команд пользователя
// Проект Graphite 5.0
// TrollingCont
// 22.02.2017

// Объект графической системы
// GS = Graphical System
let GSObject;
let pluginEntryPoints = [];

function registerPlugin(pluginEntryPoint, pluginName)
{
	if (typeof pluginEntryPoint == "function" && typeof pluginName == "string")
	{
		let pluginObj = {entryPoint: pluginEntryPoint, name: pluginName };
		pluginEntryPoints.push(pluginObj);
		return true;
	}
	return false;
}

document.body.onload = function()
{
	startup();
}

function startup()
{
	try
	{
		GSObject = new GraphDrawer(drawing_area.getContext("2d"), programParams.GSMetrics.startX, programParams.GSMetrics.startY, programParams.GSMetrics.width, programParams.GSMetrics.height,
	programParams.GSMetrics.offsetX, programParams.GSMetrics.offsetY, programParams.GSMetrics.scaleX, programParams.GSMetrics.scaleY);
	
		if (GSObject.getErrorlevel()) throw "Ошибка в GSObject, код: " + GSObject.getErrorlevel();
		graph_type.onclick = function() { changeGraphType(); }
		draw_graph.onclick = function() { drawGraph("g"); }
		draw_derivative.onclick = function() { drawGraph("d"); }
		increase_scale.onclick = function() { increaseScale(); }
		decrease_scale.onclick = function() { decreaseScale(); }
		clear_area.onclick = function() { clearArea(); }
		GSObject.setBackgroundColor(programParams.colors.GSBackground);
		GSObject.createGrid(1, programParams.colors.GSLines, 2, programParams.colors.GSMainLines);
		GSObject.redraw();
	}
	catch (exception)
	{
		alert("Ошибка при создании графической системы\n" + exception);
	}
	calculate_value.onclick = function() { openPopup(calculator); }
	calc_calculate.onclick = function() { calculateValue(); }
	open_help.onclick = function() { openPopup(help); }
	close_calc.onclick = function() { calculator.style.display = "none"; }
	close_help.onclick = function() { help.style.display = "none"; }
	if (programParams.startPlugins)
	{
		for (let i = 0; i < pluginEntryPoints.length; ++i)
		{
			pluginEntryPoints[i].entryPoint();
			console.log("Plugin \"%s\" started (entry point '%s')", pluginEntryPoints[i].name, pluginEntryPoints[i].entryPoint.name);
		}
		if (!pluginEntryPoints.length) console.log("startup :: No plugins to start");
	}
	else console.log("startup :: Starting plugins is disabled");
}

function changeGraphType()
{
	graph_type.innerHTML = (graph_type.innerHTML == "y(x)") ? "x(y)" : "y(x)";
}

function decreaseScale()
{
	let curScale = GSObject.getScaleX();
	if (programParams.GSMetrics.width / curScale < 160)
	{
		GSObject.setScaleX(curScale / 2);
		GSObject.setScaleY(curScale / 2);
		GSObject.redraw();
	}
}

function increaseScale()
{
	let curScale = GSObject.getScaleX();
	if (programParams.GSMetrics.width / curScale > 2.5)
	{
		GSObject.setScaleX(curScale * 2);
		GSObject.setScaleY(curScale * 2);
		GSObject.redraw();
	}
}

function openPopup(elem)
{
	elem.style.display = "block";
}

function errorMessage(parserErrorlevel)
{
	switch (parserErrorlevel)
	{
		case ERR_UNKNOWN_CHAR: alert("Неизвестный символ в выражении\nОшибка ERR_UNKNOWN_CHAR"); break;
		case ERR_PAIR_BRACKET_NOT_FOUND: alert("Нарушена парность скобок\nОшибка ERR_PAIR_BRACKET_NOT_FOUND"); break;
		case ERR_WRONG_ROOT_FUNC: alert("Неправильный синтаксис\nОшибка ERR_WRONG_ROOT_FUNC"); break;
		case ERR_EMPTY_FUNC: alert("Пустая функция\nОшибка ERR_EMPTY_FUNC"); break;
		default: alert("Ошибка " + parserErrorlevel);
	}
}

function calculateValue()
{
	let func = user_exp.value;
	let variable = +user_var.value;
	let parser = new Parser(func, "x", user_calc_radians.checked);
	if (isNaN(variable))
	{
		alert("Нечисловое значение переменной");
		return;
	}
	if (parser.getErrorlevel())
	{
		errorMessage(parser.getErrorlevel());
		return;
	}
	calc_answer.value = parser.getFunctionValue(variable);
}

function drawGraph(senderCommand)
{
	let red, green, blue;
	if (user_random_color.checked)
	{
		user_red.value = red = (Math.random() * 255).toFixed(0);
		user_green.value = green = (Math.random() * 255).toFixed(0);
		user_blue.value = blue = (Math.random() * 255).toFixed(0);
	}
	else
	{
		red = +user_red.value;
		green = +user_green.value;
		blue = +user_blue.value;
		if (isNaN(red) || isNaN(green) || isNaN(blue))
		{
			alert("Нечисловое значение цвета");
			return;
		}
		if (red > 255) user_red.value = red = 255;
		if (green > 255) user_green.value = green = 255;
		if (blue > 255) user_green.value = blue = 255;
		if (red < 0) user_red.value = red = 0;
		if (green < 0) user_green.value = green = 0;
		if (blue < 0) user_blue.value = blue = 0;
	}
	let userBegin, userEnd;
	if (user_autorange.checked)
	{
		userBegin = userEnd = undefined;
		user_right.value = 0.5 * GSObject.getAreaWidth() / GSObject.getScaleX();
		user_left.value = -user_right.value;
	}
	else
	{
		userBegin = +user_left.value;
		userEnd = +user_right.value;
		if (isNaN(userBegin) || isNaN(userEnd) || userBegin >= userEnd)
		{
			alert("Некорректное значение диапазона построения графика");
			return;
		}
	}
	let graphType = (graph_type.innerHTML == "x(y)");
	let isDeriv = (senderCommand == "d");
	let funcParser = new Parser(user_func.value, 'x', user_radians.checked);
	if (!graphType) funcParser = new Parser(user_func.value, 'x', user_radians.checked);
	else funcParser = new Parser(user_func.value, 'y', user_radians.checked);
	if (funcParser.getErrorlevel())
	{
		errorMessage(funcParser.getErrorlevel());
		return;
	}
	if (!GSObject.createGraph(new FunctionObject(funcParser, "rgb("+red+','+green+','+blue+')', userBegin, userEnd, isDeriv, graphType, true)))
	{
		alert("Не удалось создать график");
		return;
	}
	let index = GSObject.getLength() - 1;
	let funcListElem = document.createElement("div");
	funcListElem.style.border = "2px " + "rgb("+red+','+green+','+blue+')' + " solid";
	funcListElem.style.marginTop = "10px";
	funcListElem.style.padding = "4px";
	funcListElem.id = 'g' + index;
	funcListElem.innerHTML = "<span class='drawn_func'>";
	funcListElem.innerHTML += (graphType) ? "x(y) = " : "y(x) = ";
	funcListElem.innerHTML += user_func.value;
	if (isDeriv) funcListElem.innerHTML += " [П]</span>";
	let fleCb = document.createElement("input");
	fleCb.setAttribute("type", "checkbox");
	fleCb.setAttribute("checked", "true");
	fleCb.onclick = function() { showGraph(funcListElem.id); }
	funcListElem.insertBefore(fleCb, funcListElem.children[0]);
	let closer = document.createElement("div");
	closer.setAttribute("class", "closer defcur");
	closer.style.float = "right";
	closer.style.width = "23px";
	closer.style.height = "23px";
	closer.innerHTML = "✕";
	closer.onclick = function() { deleteGraph(funcListElem.id); }
	funcListElem.appendChild(closer);
	func_list.appendChild(funcListElem);
	GSObject.redraw();
}

function showGraph(id)
{	
	let index = +id.slice(1);
	GSObject.setGraphVisibility(index, GSObject.isVisible(index) == false);
	GSObject.redraw();
}

function deleteGraph(id)
{
	let index = +id.slice(1);
	document.getElementById(id).remove();
	GSObject.deleteGraph(index)
	GSObject.redraw();
	let len = GSObject.getLength();
	for (let i = index; i < len; ++i) func_list.children[i].id = "g" + i;
}

function clearArea()
{
	GSObject.clearGraphList();
	GSObject.redraw();
	func_list.innerHTML = "";
	
	// SPEED TEST CODE
	/*for (let i = 0; i < 8; ++i) GSObject.createGraph(new FunctionObject(new Parser(user_func.value, "x", true), "#FF0000"));
	GSObject.redraw();*/
	
}