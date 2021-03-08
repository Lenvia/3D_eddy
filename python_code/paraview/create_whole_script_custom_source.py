from paraview.simple import *
import os

rootDir = '/Users/yy/PycharmProjects/scivis2020'

#### disable automatic camera reset on 'Show'
paraview.simple._DisableFirstRenderCameraReset()

# create a new 'Legacy VTK Reader'
point_sourcevtk = LegacyVTKReader(FileNames=['/Users/yy/Desktop/point_source.vtk'])

# get active view
renderView1 = GetActiveViewOrCreate('RenderView')
# uncomment following to set a specific view size
# renderView1.ViewSize = [1916, 1276]

# show data in view
point_sourcevtkDisplay = Show(point_sourcevtk, renderView1)

# trace defaults for the display properties.
point_sourcevtkDisplay.Representation = 'Surface'
point_sourcevtkDisplay.ColorArrayName = [None, '']
point_sourcevtkDisplay.OSPRayScaleFunction = 'PiecewiseFunction'
point_sourcevtkDisplay.SelectOrientationVectors = 'None'
point_sourcevtkDisplay.ScaleFactor = 0.1291878938674927
point_sourcevtkDisplay.SelectScaleArray = 'None'
point_sourcevtkDisplay.GlyphType = 'Arrow'
point_sourcevtkDisplay.GlyphTableIndexArray = 'None'
point_sourcevtkDisplay.GaussianRadius = 0.006459394693374634
point_sourcevtkDisplay.SetScaleArray = [None, '']
point_sourcevtkDisplay.ScaleTransferFunction = 'PiecewiseFunction'
point_sourcevtkDisplay.OpacityArray = [None, '']
point_sourcevtkDisplay.OpacityTransferFunction = 'PiecewiseFunction'
point_sourcevtkDisplay.DataAxesGrid = 'GridAxesRepresentation'
point_sourcevtkDisplay.PolarAxes = 'PolarAxesRepresentation'

# reset view to fit data
renderView1.ResetCamera()

# get the material library
materialLibrary1 = GetMaterialLibrary()

# update the view to ensure updated data information
renderView1.Update()

for i in range(5):
    day = i

    vtkDir = os.path.join(rootDir, '../whole_vtk_file', 'vec' + str(day) + '.vtk')

    # create a new 'Legacy VTK Reader'
    vtk_model = LegacyVTKReader(FileNames=[vtkDir])

    # show data in view
    vtkDisplay = Show(vtk_model, renderView1)

    # trace defaults for the display properties.
    vtkDisplay.Representation = 'Outline'
    vtkDisplay.ColorArrayName = [None, '']
    vtkDisplay.OSPRayScaleArray = 'vectors'
    vtkDisplay.OSPRayScaleFunction = 'PiecewiseFunction'
    vtkDisplay.SelectOrientationVectors = 'vectors'
    vtkDisplay.ScaleFactor = 0.09980000257492067
    vtkDisplay.SelectScaleArray = 'None'
    vtkDisplay.GlyphType = 'Arrow'
    vtkDisplay.GlyphTableIndexArray = 'None'
    vtkDisplay.GaussianRadius = 0.004990000128746033
    vtkDisplay.SetScaleArray = ['POINTS', 'vectors']
    vtkDisplay.ScaleTransferFunction = 'PiecewiseFunction'
    vtkDisplay.OpacityArray = ['POINTS', 'vectors']
    vtkDisplay.OpacityTransferFunction = 'PiecewiseFunction'
    vtkDisplay.DataAxesGrid = 'GridAxesRepresentation'
    vtkDisplay.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    vtkDisplay.ScaleTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    vtkDisplay.OpacityTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Stream Tracer With Custom Source'
    streamTracerWithCustomSource1 = StreamTracerWithCustomSource(Input=vtk_model,
        SeedSource=point_sourcevtk)
    streamTracerWithCustomSource1.Vectors = ['POINTS', 'vectors']
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.9980000257492065

    # Properties modified on streamTracerWithCustomSource1
    streamTracerWithCustomSource1.InitialStepLength = 0.8
    streamTracerWithCustomSource1.MinimumStepLength = 0.8
    streamTracerWithCustomSource1.MaximumStepLength = 0.8

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # trace defaults for the display properties.
    streamTracerWithCustomSource1Display.Representation = 'Surface'
    streamTracerWithCustomSource1Display.ColorArrayName = [None, '']
    streamTracerWithCustomSource1Display.OSPRayScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.SelectOrientationVectors = 'Normals'
    streamTracerWithCustomSource1Display.ScaleFactor = 0.09476675093173981
    streamTracerWithCustomSource1Display.SelectScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GlyphType = 'Arrow'
    streamTracerWithCustomSource1Display.GlyphTableIndexArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GaussianRadius = 0.0047383375465869905
    streamTracerWithCustomSource1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.ScaleTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.OpacityTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.DataAxesGrid = 'GridAxesRepresentation'
    streamTracerWithCustomSource1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    streamTracerWithCustomSource1Display.ScaleTransferFunction.Points = [-12.423189537818525, 0.0, 0.5, 0.0, 11.9555364664793, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    streamTracerWithCustomSource1Display.OpacityTransferFunction.Points = [-12.423189537818525, 0.0, 0.5, 0.0, 11.9555364664793, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(point_sourcevtk, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Threshold'
    threshold1 = Threshold(Input=streamTracerWithCustomSource1)
    threshold1.Scalars = ['POINTS', 'AngularVelocity']

    # Properties modified on threshold1
    threshold1.ThresholdRange = [-10.0, 11.9555364664793]

    # show data in view
    threshold1Display = Show(threshold1, renderView1)

    # trace defaults for the display properties.
    threshold1Display.Representation = 'Surface'
    threshold1Display.ColorArrayName = [None, '']
    threshold1Display.OSPRayScaleArray = 'AngularVelocity'
    threshold1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    threshold1Display.SelectOrientationVectors = 'Normals'
    threshold1Display.ScaleFactor = 0.09075571466237307
    threshold1Display.SelectScaleArray = 'AngularVelocity'
    threshold1Display.GlyphType = 'Arrow'
    threshold1Display.GlyphTableIndexArray = 'AngularVelocity'
    threshold1Display.GaussianRadius = 0.004537785733118653
    threshold1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    threshold1Display.ScaleTransferFunction = 'PiecewiseFunction'
    threshold1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    threshold1Display.OpacityTransferFunction = 'PiecewiseFunction'
    threshold1Display.DataAxesGrid = 'GridAxesRepresentation'
    threshold1Display.PolarAxes = 'PolarAxesRepresentation'
    threshold1Display.ScalarOpacityUnitDistance = 0.15769824664127757

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    threshold1Display.ScaleTransferFunction.Points = [-8.134549977050085, 0.0, 0.5, 0.0, 5.163352220137988, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    threshold1Display.OpacityTransferFunction.Points = [-8.134549977050085, 0.0, 0.5, 0.0, 5.163352220137988, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()


    # save data
    folder = os.path.join('/Users/yy/Desktop', 'whole_vtk_folder')
    if not os.path.exists(folder):
        os.makedirs(folder)

    saveDir = os.path.join(folder, 'vtk' + str(day) + '.vtk')
    SaveData(saveDir, proxy=threshold1, FileType='Ascii')


    #### saving camera placements for all active views

    # current camera placement for renderView1
    renderView1.CameraPosition = [3.0948997276294596, 1.4678857337055922, 3.8015782347085514]
    renderView1.CameraFocalPoint = [0.5015804767608643, 0.5001835078001022, 0.5009314864873886]
    renderView1.CameraViewUp = [-0.7894514578086645, 0.3113445297701831, 0.5289905287866297]
    renderView1.CameraParallelScale = 1.114907049913774
    renderView1.CameraParallelProjection = 1

    #### uncomment the following to render all views
    # RenderAllViews()
    # alternatively, if you want to write images, you can use SaveScreenshot(...).

    # destroy threshold1
    Delete(threshold1)
    del threshold1

    # destroy streamTracerWithCustomSource1
    Delete(streamTracerWithCustomSource1)
    del streamTracerWithCustomSource1

    # destroy vtk_model
    Delete(vtk_model)
    del vtk_model

    print("finished.")
