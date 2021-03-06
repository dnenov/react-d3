import React from 'react'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import { Button, colors, TextField, Typography } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Divider from '@material-ui/core/Divider'
import Swatch from './Swatch'
import ColorThief from 'colorthief'

import {
  IMAGE,
  IMAGE_STYLES,
  SWATCHES_STYLES,
  Swatches,
  renderSwatches
} from "./Utils"

export const defaultDrawerWidth = 500

const styles = theme => ({
  drawer: {
    flexShrink: 0,
    width: defaultDrawerWidth
  },
  toolbar: theme.mixins.toolbar,
  dragger: {
    width: "5px",
    cursor: "ew-resize",
    padding: "4px 0 0",
    borderTop: "1px solid #ddd",
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "#f4f7f9"
  }
})

class Canvas extends React.Component {  
  constructor(){
    super()    
    this.canvas = React.createRef()
    this.secondCanvas = React.createRef()
    this.image = React.createRef()
    this.colorThief = new ColorThief()
    this.state = {
      canvasWidth: 401,
      canvasHeight: 401,
      gridWidth: 80,
      gridHeight: 80,
      gridRes: 10,
      picture: "https://i.ytimg.com/vi/wvCGaWXr8Qk/sddefault.jpg",
      imgData: "",
      debug: 80 / 10,
      colors: [],
      image: "",
      colorCount: 20,
      url: "",
      gridToggle: true
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSizeChange = this.handleSizeChange.bind(this)
    this.handleGridSizeChange = this.handleGridSizeChange.bind(this)
    this.handleGridResChange = this.handleGridResChange.bind(this)
    this.handleColors = this.handleColors.bind(this)
    this.handleColorNumberChange = this.handleColorNumberChange.bind(this)
    this.handleGridToggle = this.handleGridToggle.bind(this)
  }

  async handleSizeChange(event){
    const {value, id} = event.target
    var prevWidth, width, prevHeight, height
    prevWidth = width = this.state.canvasWidth
    prevHeight = height = this.state.canvasHeight
    const canvas = this.canvas.current
    const ctx = canvas.getContext('2d')   
    if(id === "canvas-width")
    {
      width = value  
    }
    else{
      height = value
    } 
    const imageData = this.state.imgData
    const img = await window.createImageBitmap(imageData,0,0,prevWidth,prevHeight,{ width, height})
    ctx.drawImage(img,0,0,width,height)
    const data = ctx.getImageData(0,0,width,height)   
    this.setState(prevState => ({
      canvasWidth: width,
      canvasHeight: height,
      imgData: data
    }))   
  }

  handleGridSizeChange(event){
    const {value, name} = event.target
    this.setState(prevState => ({
       gridWidth: value,
       gridHeight: value,
      //  debug: value / this.state.gridRes
    }))
  }

  handleGridToggle(event){
    this.setState({gridToggle: !this.state.gridToggle})
    this.drawGrid()
  }

  handleGridResChange(event){
    const {value, name} = event.target
    this.setState(prevState => ({
       gridRes: value,
      //  debug: this.state.gridWidth / value
    }))
  }
  

  handleColorNumberChange(event){
    const {value} = event.target    
    const DOMURL = window.URL || window.webkitURL || window
    const img = this.image.current
    const url = DOMURL.createObjectURL(this.state.url)
    img.src = url 
    img.crossOrigin = "Anonymous"  
    
    var maxH = 1000 > this.state.canvasWidth ? this.state.canvasWidth : 1000
    var maxW = 1000 > this.state.canvasHeight ? this.state.canvasHeight : 1000

    img.onload  = () => {
      const iw = img.width;
      const ih = img.height;
      
      maxH = 1000 > iw ? iw : 1000
      maxW = 1000 > ih ? ih : 1000

      const scale=Math.min((maxW/iw),(maxH/ih));
      const iwScaled=iw*scale;
      const ihScaled=ih*scale;
      
      const palette = this.colorThief.getPalette(img, this.state.colorCount) 
      
      console.log(this.state.colorCount + ": " + palette)

      this.setState(({
        colors: palette,
        colorCount: value,
        debug: value
      }))
      DOMURL.revokeObjectURL(url)  
    }
  }

  handleChange(event){
    const DOMURL = window.URL || window.webkitURL || window
    const img = this.image.current
    const canvas = this.canvas.current
    const ctx = canvas.getContext('2d')
    const file = event.target.files[0]
    const url = DOMURL.createObjectURL(event.target.files[0])
    img.src = url 
    img.crossOrigin = "Anonymous"  
    
    var maxH = 1000 > this.state.canvasWidth ? this.state.canvasWidth : 1000
    var maxW = 1000 > this.state.canvasHeight ? this.state.canvasHeight : 1000

    img.onload  = () => {
      const iw = img.width;
      const ih = img.height;
      
      maxH = 1000 > iw ? iw : 1000
      maxW = 1000 > ih ? ih : 1000

      const scale=Math.min((maxW/iw),(maxH/ih));
      const iwScaled=iw*scale;
      const ihScaled=ih*scale;
      canvas.width=iwScaled;
      canvas.height=ihScaled;
      ctx.drawImage(img,0,0,iwScaled,ihScaled);
      const data = ctx.getImageData(0,0,iwScaled, ihScaled)
      
      const palette = this.colorThief.getPalette(img, this.state.colorCount)

      this.setState(prevState => ({
        picture: img,        
        imgData: data,
        image: ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        colors: palette,
        url: file
      }))
      DOMURL.revokeObjectURL(url)
    }
  }

  handleColors(event){
    const canvas = this.canvas.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0,0,this.state.imgData.width,this.state.imgData.height)       
    var data = imageData.data

    const secondCanvas = this.secondCanvas.current
    const ctx2 = secondCanvas.getContext('2d')

    var res = Math.floor(this.state.gridWidth / this.state.gridRes)

    var width = this.state.canvasWidth
    var height = this.state.canvasHeight
    var cellX = 0
    var cellY = 0
    var colorSet = new Set()

    for (var x = 0; x <= width; x++) {
      cellY = 0
      if(x%res === 0) cellX ++
      for (var y = 0; y <= height; y++) {
        if(y%res === 0) 
        {
          cellY ++
          var copy = ((res * cellY) * width + res * cellX) * 4
          var color = this.GetClosestColor([data[copy],data[copy+1],data[copy+2]])
        }

        var index = (y * width + x) * 4

        data[index] = color[0]
        data[index + 1] = color[1]
        data[index + 2] = color[2]
      }
    }
    // this.drawGrid()
    ctx2.putImageData(imageData, 0, 0)    
  }

  GetClosestColor(col)
  {
    var distance = 1000000
    var color = ""
    for(var i = 0; i < this.state.colors.length - 1; i++){
      var d = this.Distance(this.state.colors[i], col)
      if(d < distance)
      {
        distance = d
        color = this.state.colors[i]
      }
    }
    return color
  }

  Distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2))
  }
  
  componentDidUpdate(prevProps, prevState){       
    // after any update
    // 1. draw the grid
    // 2. if we have image data, draw the image
    // 3. finally, create the pixelated image
    if(typeof(this.state.imgData) === 'object')
    {      
      if(!this.state.gridToggle) this.drawGrid()
      this.drawImage()
      this.copyPixels()       
    } 
  } 
  
  componentDidMount(){
    this.drawGrid()
    typeof(this.state.imgData) === 'object' && this.drawImage()  
    console.log('mount')
  }  

  drawImage(){
    const canvas = this.canvas.current
    const ctx = canvas.getContext('2d')
    ctx.putImageData(this.state.imgData, 0, 0)   
  }

  copyPixels(){    
    const canvas = this.canvas.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0,0,this.state.imgData.width,this.state.imgData.height)       
    var data = imageData.data

    const secondCanvas = this.secondCanvas.current
    const ctx2 = secondCanvas.getContext('2d')

    var res = Math.floor(this.state.gridWidth / this.state.gridRes)

    var width = this.state.canvasWidth
    var height = this.state.canvasHeight
    var cellX = 0
    var cellY = 0
    var colorSet = new Set()

    for (var x = 0; x <= width; x++) {
      cellY = 0
      if(x%res === 0) cellX ++
      for (var y = 0; y <= height; y++) {
        if(y%res === 0) 
        {
          cellY ++
          var copy = ((res * cellY) * width + res * cellX) * 4
          colorSet.add([data[copy], data[copy + 1], data[copy + 2]])
        }

        var index = (y * width + x) * 4

        data[index] = data[copy]
        data[index + 1] = data[copy + 1]
        data[index + 2] = data[copy + 2]
      }
    }
   
    ctx2.putImageData(imageData, 0, 0)    
  }   

  drawGrid(){
    console.log("draw grid")
    const canvas = this.secondCanvas.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0,0,canvas.width, canvas.height)
    if(!this.state.gridToggle) return
    const w = this.state.gridWidth
    const h = this.state.gridHeight
    const r = this.state.gridRes
    const ps = "M " + w/r + " 0 L 0 0 0 " + h/r
    const p = "M " + w + " 0 L 0 0 0 " + h

    var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
          <defs> \
              <pattern id="smallGrid" width="'+w/r+'" height="'+h/r+'" patternUnits="userSpaceOnUse"> \
                  <path d="'+p+'" fill="none" stroke="pink" stroke-width="0.5" /> \
              </pattern> \
              <pattern id="grid" width="'+w+'" height="'+h+'" patternUnits="userSpaceOnUse"> \
                  <rect width="'+w+'" height="'+h+'" fill="url(#smallGrid)" /> \
                  <path d="'+p+'" fill="none" stroke="pink" stroke-width="1" /> \
              </pattern> \
          </defs> \
          <rect width="100%" height="100%" fill="url(#grid)" /> \
      </svg>';

    var DOMURL = window.URL || window.webkitURL || window
    
    var imgGrid = new Image()
    var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'})
    var url = DOMURL.createObjectURL(svg)
    imgGrid.src = url   
    imgGrid.onload  = () => {
      ctx.drawImage(imgGrid, 0, 0)
      DOMURL.revokeObjectURL(url)
    }
  }
 
  render() {
      const hidden = {
        display: "none"
      }
      const { classes } = this.props     

      return(      
        <div> 
        <Grid container direction="row" spacing={2}>   
          <Grid item xs={3}>
            <Box
              p={1} 
              border={1} 
              borderColor="grey.200" 
              borderRadius={10} 
              minHeight={360}>
              <Grid container direction="column"> 
                <Grid item>
                  <TextField 
                      id="canvas-width"
                      type="number" 
                      label="Canvas width"
                      variant="outlined"
                      color="primary"
                      inputProps={{ step: "5" }}
                      value={this.state.canvasWidth}
                      onChange={this.handleSizeChange}
                    /> 
                </Grid>
                <Grid item>
                  <TextField     
                    id="canvas-height"
                    type="number" 
                    label="Canvas height"
                    variant="outlined"
                    color="primary"
                    inputProps={{ step: "5" }}
                    value={this.state.canvasHeight}
                    onChange={this.handleSizeChange}
                  /> 
                </Grid>
                <Grid item>
                  <TextField 
                    id="grid-width"
                    type="number" 
                    label="Grid size"
                    variant="outlined"
                    color="primary"
                    value={this.state.gridWidth}
                    onChange={this.handleGridSizeChange}
                  /> 
                </Grid>
                <Grid item>
                  <TextField 
                    id="grid-res"
                    type="number" 
                    label="Grid squares per inch"
                    variant="outlined"
                    color="primary"
                    value={this.state.gridRes}
                    onChange={this.handleGridResChange}
                  />    
                </Grid>
                <Grid item>
                  <input 
                      accept="image/*"
                      type="file" 
                      id="selectedFile" 
                      style={{display: "none"}} 
                      onChange={this.handleChange} /> 
                  <label htmlFor="selectedFile">
                    <Button variant="contained" component="span" color="primary">
                      Browse ..
                    </Button>
                  </label> 
                </Grid>  
                {/* <Grid item>
                  <label>{this.state.debug}</label>
                </Grid> */}
              </Grid>   
            </Box>
            <Box 
              p={1} 
              border={1} 
              borderColor="grey.200" 
              borderRadius={10}>
              {/* <Swatches colors = {this.state.colors} renderSwatches={renderSwatches}/> */}
              <Grid container direction="row">
                {this.state.colors.map((color, key) => ( <Swatch key={key} color={color}></Swatch> ))}
              </Grid>
              {/* <Swatch colors = {this.state.colors}></Swatch> */}
              <Button variant="contained" component="span" color="primary" onClick={this.handleColors}>Colors</Button>
              <Button style={{marginLeft: 10}} variant="contained" component="span" color="primary" onClick={this.handleGridToggle}>Grid</Button>
              {/* <TextField 
                    id="color-number"
                    type="number" 
                    label="Number of colors"
                    variant="outlined"
                    color="primary"
                    value={this.state.colorCount}
                    onChange={this.handleColorNumberChange}
                  />  */}
            </Box>
          </Grid> 
          <Grid item xs={9} container direction="row">
            <Box 
              p={1} 
              border={1} 
              borderColor="grey.200" 
              borderRadius={10} 
              minHeight={360}>              
                <canvas 
                  ref={this.canvas} 
                  width={this.state.canvasWidth} 
                  height={this.state.canvasHeight} />
                <img 
                  ref={this.image} 
                  src={this.state.picture} 
                  style={hidden} />
            </Box>
            <Box 
              p={1} 
              border={1} 
              borderColor="grey.200" 
              borderRadius={10} 
              minHeight={360}>    
                <canvas 
                  marginLeft={10}
                  ref={this.secondCanvas} 
                  width={this.state.canvasWidth} 
                  height={this.state.canvasHeight} />
              </Box>
          </Grid>   
        </Grid>        
        <Divider style={{marginTop: "20px"}}/> 
        </div>
      )
    }
  }

export default withStyles(styles, { withTheme: true })(Canvas)