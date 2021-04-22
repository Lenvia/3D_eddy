# trace generated using paraview version 5.7.0
#
# To ensure correct image size when batch processing, please search 
# for and uncomment the line `# renderView*.ViewSize = [*,*]`

#### import the simple module from the paraview
from paraview.simple import *
#### disable automatic camera reset on 'Show'
paraview.simple._DisableFirstRenderCameraReset()

for day in range(30):
    day_str = str(day)
    # create a new 'Legacy VTK Reader'
    points0vtk = LegacyVTKReader(FileNames=['/Users/yy/Desktop/points_force_2_pp_20000/Points' + day_str + '.vtk'])

    # create a new 'Legacy VTK Reader'
    vec0vtk = LegacyVTKReader(FileNames=['/Users/yy/Desktop/whole_vtk_file/vec' + day_str + '.vtk'])

    # get active view
    renderView1 = GetActiveViewOrCreate('RenderView')
    # uncomment following to set a specific view size
    # renderView1.ViewSize = [1916, 1260]

    # show data in view
    points0vtkDisplay = Show(points0vtk, renderView1)

    # trace defaults for the display properties.
    points0vtkDisplay.Representation = 'Surface'
    points0vtkDisplay.ColorArrayName = [None, '']
    points0vtkDisplay.OSPRayScaleFunction = 'PiecewiseFunction'
    points0vtkDisplay.SelectOrientationVectors = 'None'
    points0vtkDisplay.ScaleFactor = 0.09959999918937684
    points0vtkDisplay.SelectScaleArray = 'None'
    points0vtkDisplay.GlyphType = 'Arrow'
    points0vtkDisplay.GlyphTableIndexArray = 'None'
    points0vtkDisplay.GaussianRadius = 0.004979999959468842
    points0vtkDisplay.SetScaleArray = [None, '']
    points0vtkDisplay.ScaleTransferFunction = 'PiecewiseFunction'
    points0vtkDisplay.OpacityArray = [None, '']
    points0vtkDisplay.OpacityTransferFunction = 'PiecewiseFunction'
    points0vtkDisplay.DataAxesGrid = 'GridAxesRepresentation'
    points0vtkDisplay.PolarAxes = 'PolarAxesRepresentation'

    # reset view to fit data
    renderView1.ResetCamera()

    # get the material library
    materialLibrary1 = GetMaterialLibrary()

    # show data in view
    vec0vtkDisplay = Show(vec0vtk, renderView1)

    # trace defaults for the display properties.
    vec0vtkDisplay.Representation = 'Outline'
    vec0vtkDisplay.ColorArrayName = [None, '']
    vec0vtkDisplay.OSPRayScaleArray = 'vectors'
    vec0vtkDisplay.OSPRayScaleFunction = 'PiecewiseFunction'
    vec0vtkDisplay.SelectOrientationVectors = 'vectors'
    vec0vtkDisplay.ScaleFactor = 0.09980000257492067
    vec0vtkDisplay.SelectScaleArray = 'None'
    vec0vtkDisplay.GlyphType = 'Arrow'
    vec0vtkDisplay.GlyphTableIndexArray = 'None'
    vec0vtkDisplay.GaussianRadius = 0.004990000128746033
    vec0vtkDisplay.SetScaleArray = ['POINTS', 'vectors']
    vec0vtkDisplay.ScaleTransferFunction = 'PiecewiseFunction'
    vec0vtkDisplay.OpacityArray = ['POINTS', 'vectors']
    vec0vtkDisplay.OpacityTransferFunction = 'PiecewiseFunction'
    vec0vtkDisplay.DataAxesGrid = 'GridAxesRepresentation'
    vec0vtkDisplay.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    vec0vtkDisplay.ScaleTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    vec0vtkDisplay.OpacityTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Stream Tracer With Custom Source'
    streamTracerWithCustomSource1 = StreamTracerWithCustomSource(Input=vec0vtk,
        SeedSource=points0vtk)
    streamTracerWithCustomSource1.Vectors = ['POINTS', 'vectors']
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.9980000257492065

    # Properties modified on streamTracerWithCustomSource1
    streamTracerWithCustomSource1.IntegrationDirection = 'BACKWARD'
    streamTracerWithCustomSource1.MinimumStepLength = 0.2
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.5

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # trace defaults for the display properties.
    streamTracerWithCustomSource1Display.Representation = 'Surface'
    streamTracerWithCustomSource1Display.ColorArrayName = [None, '']
    streamTracerWithCustomSource1Display.OSPRayScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.SelectOrientationVectors = 'Normals'
    streamTracerWithCustomSource1Display.ScaleFactor = 0.0945904789492488
    streamTracerWithCustomSource1Display.SelectScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GlyphType = 'Arrow'
    streamTracerWithCustomSource1Display.GlyphTableIndexArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GaussianRadius = 0.0047295239474624395
    streamTracerWithCustomSource1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.ScaleTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.OpacityTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.DataAxesGrid = 'GridAxesRepresentation'
    streamTracerWithCustomSource1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    streamTracerWithCustomSource1Display.ScaleTransferFunction.Points = [-12.234839286664087, 0.0, 0.5, 0.0, 21.600917134090775, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    streamTracerWithCustomSource1Display.OpacityTransferFunction.Points = [-12.234839286664087, 0.0, 0.5, 0.0, 21.600917134090775, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(points0vtk, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Tube'
    tube1 = Tube(Input=streamTracerWithCustomSource1)
    tube1.Scalars = ['POINTS', 'AngularVelocity']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.009459047894924879

    # Properties modified on tube1
    tube1.NumberofSides = 4
    tube1.Radius = 0.0005

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # trace defaults for the display properties.
    tube1Display.Representation = 'Surface'
    tube1Display.ColorArrayName = [None, '']
    tube1Display.OSPRayScaleArray = 'AngularVelocity'
    tube1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    tube1Display.SelectOrientationVectors = 'Normals'
    tube1Display.ScaleFactor = 0.09464052300900222
    tube1Display.SelectScaleArray = 'AngularVelocity'
    tube1Display.GlyphType = 'Arrow'
    tube1Display.GlyphTableIndexArray = 'AngularVelocity'
    tube1Display.GaussianRadius = 0.00473202615045011
    tube1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    tube1Display.ScaleTransferFunction = 'PiecewiseFunction'
    tube1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    tube1Display.OpacityTransferFunction = 'PiecewiseFunction'
    tube1Display.DataAxesGrid = 'GridAxesRepresentation'
    tube1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    tube1Display.ScaleTransferFunction.Points = [-12.234839286664087, 0.0, 0.5, 0.0, 21.600917134090775, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    tube1Display.OpacityTransferFunction.Points = [-12.234839286664087, 0.0, 0.5, 0.0, 21.600917134090775, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Threshold'
    threshold1 = Threshold(Input=tube1)
    threshold1.Scalars = ['POINTS', 'AngularVelocity']
    threshold1.ThresholdRange = [-12.234839286664087, 21.60091713409078]

    # Properties modified on threshold1
    threshold1.ThresholdRange = [-5.0, 21.60091713409078]

    # show data in view
    threshold1Display = Show(threshold1, renderView1)

    # trace defaults for the display properties.
    threshold1Display.Representation = 'Surface'
    threshold1Display.ColorArrayName = [None, '']
    threshold1Display.OSPRayScaleArray = 'AngularVelocity'
    threshold1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    threshold1Display.SelectOrientationVectors = 'Normals'
    threshold1Display.ScaleFactor = 0.09327831789851189
    threshold1Display.SelectScaleArray = 'AngularVelocity'
    threshold1Display.GlyphType = 'Arrow'
    threshold1Display.GlyphTableIndexArray = 'AngularVelocity'
    threshold1Display.GaussianRadius = 0.004663915894925595
    threshold1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    threshold1Display.ScaleTransferFunction = 'PiecewiseFunction'
    threshold1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    threshold1Display.OpacityTransferFunction = 'PiecewiseFunction'
    threshold1Display.DataAxesGrid = 'GridAxesRepresentation'
    threshold1Display.PolarAxes = 'PolarAxesRepresentation'
    threshold1Display.ScalarOpacityUnitDistance = 0.08516358527094627

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    threshold1Display.ScaleTransferFunction.Points = [-4.859637708762256, 0.0, 0.5, 0.0, 21.60091713409078, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    threshold1Display.OpacityTransferFunction.Points = [-4.859637708762256, 0.0, 0.5, 0.0, 21.60091713409078, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(tube1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # save data
    SaveData('/Users/yy/Desktop/temp_local_vtk_folder/temp_force_2_pp_20000/tube' + day_str + '.vtk', proxy=threshold1, FileType='Ascii')

    #### saving camera placements for all active views

    # current camera placement for renderView1
    renderView1.CameraPosition = [-0.1825219118597031, 1.0146920735606793, 3.6602335039271843]
    renderView1.CameraFocalPoint = [0.497999995946884, 0.497999995946884, 0.47999998927116383]
    renderView1.CameraViewUp = [-0.4405700344458471, 0.8664031251741243, -0.2350397188495933]
    renderView1.CameraParallelScale = 0.8522957125473005

    #### uncomment the following to render all views
    # RenderAllViews()
    # alternatively, if you want to write images, you can use SaveScreenshot(...).

    # destroy threshold1
    Delete(threshold1)
    del threshold1

    # destroy tube1
    Delete(tube1)
    del tube1

    # destroy streamTracerWithCustomSource1
    Delete(streamTracerWithCustomSource1)
    del streamTracerWithCustomSource1

    # destroy vec0vtk
    Delete(vec0vtk)
    del vec0vtk

    # destroy points0vtk
    Delete(points0vtk)
    del points0vtk