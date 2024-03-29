'use strict';

import Core from '../../tools/core.js';
import Dom from '../../tools/dom.js';
import Tooltip from '../../ui/tooltip.js';
import Automator from '../../components/automator.js';
import Styler from '../../components/styler.js';
import Grid from '../grid/grid.js';

export default Core.Templatable("Auto.Grid", class AutoGrid extends Automator { 

	get canvas() { return this.widget.canvas; }

	constructor(node, simulation, options) {
		if (!options) throw new Error("No options provided for the Grid widget");
		
		super(new Grid(node), simulation);
		
		this.options = options;
		
		this.widget.dimensions = this.simulation.dimensions;
		this.widget.columns = options.columns;
		this.widget.spacing	= options.spacing;
		this.widget.layers	= options.layers;
		this.widget.styles	= options.styles;
		
		this.AttachHandlers(options);
		
		this.BuildTooltip();
	}
	
	AttachHandlers(options) {
		var h = [];
		
		if (options.hoverEnabled != false) h.push(this.widget.On("MouseMove", this.onMouseMove_Handler.bind(this)));
		if (options.hoverEnabled != false) h.push(this.widget.On("MouseOut", this.onMouseOut_Handler.bind(this)));
		if (options.clickEnabled != false) h.push(this.widget.On("Click", this.onClick_Handler.bind(this)));
		
		h.push(this.simulation.On("Move", this.onSimulationMove_Handler.bind(this)));
		h.push(this.simulation.On("Jump", this.onSimulationJump_Handler.bind(this)));
		
		options.On("change", this.OnSettings_Change.bind(this));
		options.On("change:styles", this.OnSettingsStyles_Change.bind(this));
		options.On("change:layers", this.OnSettingsLayers_Change.bind(this));
		
		this.Handle(h);
	}
	
	BuildTooltip() {
		this.tooltip = new Tooltip();
		
		this.tooltip.nodes.label = Dom.Create("div", { className:"tooltip-label" }, this.tooltip.Elem("content"));
	}
	
	Resize() {
		var n = this.widget.layers.length;
		var size = this.options.CanvasSize(this.simulation, n);
			
		this.widget.container.style.width = size.width + "px";
		this.widget.container.style.height = size.height + "px";	
	}
	
	Redraw() {
		this.widget.Resize();
		
		this.widget.DrawState(this.simulation.state, this.simulation);
	}
	
	OnSettings_Change(ev) {			
		var check = ["height", "width", "columns", "spacing", "aspect", "layers"];

		if (check.indexOf(ev.property) == -1) return;
		
		this.widget.columns = this.options.columns;
		this.widget.spacing = this.options.spacing;
		this.widget.layers = this.options.layers;
		
		this.Resize();
		this.Redraw();
	}
	
	OnSettingsStyles_Change(ev) {			
		this.Redraw();
	}
	
	OnSettingsLayers_Change(ev) {			
		this.Redraw();
	}
	
	onSimulationMove_Handler(ev) {		
		var s = this.simulation;
		
		this.widget.DrawChanges(ev.frame, s);
	}
	
	onSimulationJump_Handler(ev) {
		var s = this.simulation;
		
		this.widget.DrawState(s.state, s);
	}
	
	onSimulationPaletteChanged_Handler(ev) {
		var s = this.simulation;
		
		this.widget.DrawState(s.state, s);
	}
	
	onMouseMove_Handler(ev) {
		var labels = [];
		
		ev.data.layer.ports.forEach(port => {
			var state = this.simulation.state.get_value([ev.data.x, ev.data.y, ev.data.layer.z]);
			var subs = [ev.data.x, ev.data.y, ev.data.layer.z, state[port], port];
			
			labels.push(this.nls.Ressource("Grid_Tooltip_Title", subs));
			
			this.tooltip.Show(ev.x + 20, ev.y);
		});
		
		this.tooltip.nodes.label.innerHTML = labels.join("<br>");
	}
	
	onMouseOut_Handler(ev) {
		this.tooltip.Hide();
	}
	
	onClick_Handler(ev) {
		var id = [ev.data.x, ev.data.y, ev.data.z];
		
		if (this.simulation.is_selected(id)) {
			this.simulation.deselect(id);
			
			// TODO: This is nasty. Maybe just store the original color along with the id.
			var port = ev.data.layer.ports[ev.data.layer.ports.length - 1];
			var value = this.simulation.state.get_value(id);
			var scale = this.widget.styler.GetScale(ev.data.layer.style);
			var color = this.widget.styler.GetColor(scale, value[port]);
			
			this.widget.DrawCellBorder(ev.data.x, ev.data.y, ev.data.k, color);
		} 
		
		else {
			this.simulation.select(id);
			
			this.widget.DrawCellBorder(ev.data.x, ev.data.y, ev.data.k, 'rgb(255,0,0)');
		}
	}
	
	static Nls() {
		return {
			"Grid_Tooltip_Title" : {
				"en" : "The state of cell <b>({0}, {1}, {2})</b> on port <b>{4}</b> is <b>{3}</b>."		
			}
		}
	}
});