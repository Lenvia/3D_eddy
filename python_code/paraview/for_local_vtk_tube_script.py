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
    vec0vtk = LegacyVTKReader(FileNames=['/Users/yy/Desktop/whole_vtk_file/vec'+day_str+'.vtk'])

    # get active view
    renderView1 = GetActiveViewOrCreate('RenderView')
    # uncomment following to set a specific view size
    # renderView1.ViewSize = [1916, 1260]

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

    # reset view to fit data
    renderView1.ResetCamera()

    # get the material library
    materialLibrary1 = GetMaterialLibrary()

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Legacy VTK Reader'
    points0vtk = LegacyVTKReader(FileNames=['/Users/yy/Desktop/points_force_2_pp_10000/Points'+day_str+'.vtk'])

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

    # update the view to ensure updated data information
    renderView1.Update()

    # set active source
    SetActiveSource(vec0vtk)

    # create a new 'Extract Subset'
    extractSubset1 = ExtractSubset(Input=vec0vtk)
    extractSubset1.VOI = [0, 499, 0, 499, 0, 49]

    # Properties modified on extractSubset1
    extractSubset1.VOI = [0, 249, 250, 499, 0, 49]

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # trace defaults for the display properties.
    extractSubset1Display.Representation = 'Outline'
    extractSubset1Display.ColorArrayName = [None, '']
    extractSubset1Display.OSPRayScaleArray = 'vectors'
    extractSubset1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    extractSubset1Display.SelectOrientationVectors = 'vectors'
    extractSubset1Display.ScaleFactor = 0.09800000190734864
    extractSubset1Display.SelectScaleArray = 'None'
    extractSubset1Display.GlyphType = 'Arrow'
    extractSubset1Display.GlyphTableIndexArray = 'None'
    extractSubset1Display.GaussianRadius = 0.004900000095367432
    extractSubset1Display.SetScaleArray = ['POINTS', 'vectors']
    extractSubset1Display.ScaleTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.OpacityArray = ['POINTS', 'vectors']
    extractSubset1Display.OpacityTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.DataAxesGrid = 'GridAxesRepresentation'
    extractSubset1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    extractSubset1Display.ScaleTransferFunction.Points = [-0.7194229960441589, 0.0, 0.5, 0.0, 0.4345960021018982, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    extractSubset1Display.OpacityTransferFunction.Points = [-0.7194229960441589, 0.0, 0.5, 0.0, 0.4345960021018982, 1.0, 0.5, 0.0]

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Stream Tracer With Custom Source'
    streamTracerWithCustomSource1 = StreamTracerWithCustomSource(Input=extractSubset1,
        SeedSource=points0vtk)
    streamTracerWithCustomSource1.Vectors = ['POINTS', 'vectors']
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.9800000190734863

    # Properties modified on streamTracerWithCustomSource1
    streamTracerWithCustomSource1.IntegrationDirection = 'BACKWARD'
    streamTracerWithCustomSource1.InitialStepLength = 1.0
    streamTracerWithCustomSource1.MinimumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.5

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # trace defaults for the display properties.
    streamTracerWithCustomSource1Display.Representation = 'Surface'
    streamTracerWithCustomSource1Display.ColorArrayName = [None, '']
    streamTracerWithCustomSource1Display.OSPRayScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.SelectOrientationVectors = 'Normals'
    streamTracerWithCustomSource1Display.ScaleFactor = 0.08251785039901734
    streamTracerWithCustomSource1Display.SelectScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GlyphType = 'Arrow'
    streamTracerWithCustomSource1Display.GlyphTableIndexArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GaussianRadius = 0.004125892519950867
    streamTracerWithCustomSource1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.ScaleTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.OpacityTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.DataAxesGrid = 'GridAxesRepresentation'
    streamTracerWithCustomSource1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    streamTracerWithCustomSource1Display.ScaleTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    streamTracerWithCustomSource1Display.OpacityTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(points0vtk, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Tube'
    tube1 = Tube(Input=streamTracerWithCustomSource1)
    tube1.Scalars = ['POINTS', 'AngularVelocity']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.008251785039901734

    # Properties modified on tube1
    tube1.Radius = 0.005

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # trace defaults for the display properties.
    tube1Display.Representation = 'Surface'
    tube1Display.ColorArrayName = [None, '']
    tube1Display.OSPRayScaleArray = 'AngularVelocity'
    tube1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    tube1Display.SelectOrientationVectors = 'Normals'
    tube1Display.ScaleFactor = 0.08349027680233122
    tube1Display.SelectScaleArray = 'AngularVelocity'
    tube1Display.GlyphType = 'Arrow'
    tube1Display.GlyphTableIndexArray = 'AngularVelocity'
    tube1Display.GaussianRadius = 0.004174513840116561
    tube1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    tube1Display.ScaleTransferFunction = 'PiecewiseFunction'
    tube1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    tube1Display.OpacityTransferFunction = 'PiecewiseFunction'
    tube1Display.DataAxesGrid = 'GridAxesRepresentation'
    tube1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    tube1Display.ScaleTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    tube1Display.OpacityTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # Properties modified on tube1
    tube1.Radius = 0.0005

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Threshold'
    threshold1 = Threshold(Input=tube1)
    threshold1.Scalars = ['POINTS', 'AngularVelocity']
    threshold1.ThresholdRange = [-4.600615519188283, 4.425967793406962]

    # Properties modified on threshold1
    threshold1.ThresholdRange = [-5.0, 4.425967793406962]

    # show data in view
    threshold1Display = Show(threshold1, renderView1)

    # trace defaults for the display properties.
    threshold1Display.Representation = 'Surface'
    threshold1Display.ColorArrayName = [None, '']
    threshold1Display.OSPRayScaleArray = 'AngularVelocity'
    threshold1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    threshold1Display.SelectOrientationVectors = 'Normals'
    threshold1Display.ScaleFactor = 0.08209780817269348
    threshold1Display.SelectScaleArray = 'AngularVelocity'
    threshold1Display.GlyphType = 'Arrow'
    threshold1Display.GlyphTableIndexArray = 'AngularVelocity'
    threshold1Display.GaussianRadius = 0.004104890408634674
    threshold1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    threshold1Display.ScaleTransferFunction = 'PiecewiseFunction'
    threshold1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    threshold1Display.OpacityTransferFunction = 'PiecewiseFunction'
    threshold1Display.DataAxesGrid = 'GridAxesRepresentation'
    threshold1Display.PolarAxes = 'PolarAxesRepresentation'
    threshold1Display.ScalarOpacityUnitDistance = 0.07289163383951895

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    threshold1Display.ScaleTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    threshold1Display.OpacityTransferFunction.Points = [-4.600615519188283, 0.0, 0.5, 0.0, 4.425967793406963, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(tube1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # save data
    SaveData('/Users/yy/Desktop/local_vtk_folder/temp_force_2_pp_10000/' + day_str + '_1.vtk', proxy=threshold1, FileType='Ascii')

    # set active source
    SetActiveSource(tube1)

    # hide data in view
    Hide(threshold1, renderView1)

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # destroy threshold1
    Delete(threshold1)
    del threshold1

    # set active source
    SetActiveSource(streamTracerWithCustomSource1)

    # hide data in view
    Hide(tube1, renderView1)

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # destroy tube1
    Delete(tube1)
    del tube1

    # set active source
    SetActiveSource(extractSubset1)

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # destroy streamTracerWithCustomSource1
    Delete(streamTracerWithCustomSource1)
    del streamTracerWithCustomSource1

    # set active source
    SetActiveSource(vec0vtk)

    # hide data in view
    Hide(extractSubset1, renderView1)

    # show data in view
    vec0vtkDisplay = Show(vec0vtk, renderView1)

    # destroy extractSubset1
    Delete(extractSubset1)
    del extractSubset1

    # create a new 'Extract Subset'
    extractSubset1 = ExtractSubset(Input=vec0vtk)
    extractSubset1.VOI = [0, 499, 0, 499, 0, 49]

    # Properties modified on extractSubset1
    extractSubset1.VOI = [250, 499, 0, 249, 0, 49]

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # trace defaults for the display properties.
    extractSubset1Display.Representation = 'Outline'
    extractSubset1Display.ColorArrayName = [None, '']
    extractSubset1Display.OSPRayScaleArray = 'vectors'
    extractSubset1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    extractSubset1Display.SelectOrientationVectors = 'vectors'
    extractSubset1Display.ScaleFactor = 0.09800000190734864
    extractSubset1Display.SelectScaleArray = 'None'
    extractSubset1Display.GlyphType = 'Arrow'
    extractSubset1Display.GlyphTableIndexArray = 'None'
    extractSubset1Display.GaussianRadius = 0.004900000095367432
    extractSubset1Display.SetScaleArray = ['POINTS', 'vectors']
    extractSubset1Display.ScaleTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.OpacityArray = ['POINTS', 'vectors']
    extractSubset1Display.OpacityTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.DataAxesGrid = 'GridAxesRepresentation'
    extractSubset1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    extractSubset1Display.ScaleTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    extractSubset1Display.OpacityTransferFunction.Points = [-0.7852849960327148, 0.0, 0.5, 0.0, 0.8659229874610901, 1.0, 0.5, 0.0]

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Stream Tracer With Custom Source'
    streamTracerWithCustomSource1 = StreamTracerWithCustomSource(Input=extractSubset1,
        SeedSource=points0vtk)
    streamTracerWithCustomSource1.Vectors = ['POINTS', 'vectors']
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.9800000190734863

    # Properties modified on streamTracerWithCustomSource1
    streamTracerWithCustomSource1.IntegrationDirection = 'BACKWARD'
    streamTracerWithCustomSource1.InitialStepLength = 1.0
    streamTracerWithCustomSource1.MinimumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.5

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # trace defaults for the display properties.
    streamTracerWithCustomSource1Display.Representation = 'Surface'
    streamTracerWithCustomSource1Display.ColorArrayName = [None, '']
    streamTracerWithCustomSource1Display.OSPRayScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.SelectOrientationVectors = 'Normals'
    streamTracerWithCustomSource1Display.ScaleFactor = 0.09003769755363465
    streamTracerWithCustomSource1Display.SelectScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GlyphType = 'Arrow'
    streamTracerWithCustomSource1Display.GlyphTableIndexArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GaussianRadius = 0.004501884877681732
    streamTracerWithCustomSource1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.ScaleTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.OpacityTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.DataAxesGrid = 'GridAxesRepresentation'
    streamTracerWithCustomSource1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    streamTracerWithCustomSource1Display.ScaleTransferFunction.Points = [-6.605447513712243, 0.0, 0.5, 0.0, 7.437162085145272, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    streamTracerWithCustomSource1Display.OpacityTransferFunction.Points = [-6.605447513712243, 0.0, 0.5, 0.0, 7.437162085145272, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(points0vtk, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Tube'
    tube1 = Tube(Input=streamTracerWithCustomSource1)
    tube1.Scalars = ['POINTS', 'AngularVelocity']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.009003769755363464

    # Properties modified on tube1
    tube1.Radius = 0.0005

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # trace defaults for the display properties.
    tube1Display.Representation = 'Surface'
    tube1Display.ColorArrayName = [None, '']
    tube1Display.OSPRayScaleArray = 'AngularVelocity'
    tube1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    tube1Display.SelectOrientationVectors = 'Normals'
    tube1Display.ScaleFactor = 0.0901250229420839
    tube1Display.SelectScaleArray = 'AngularVelocity'
    tube1Display.GlyphType = 'Arrow'
    tube1Display.GlyphTableIndexArray = 'AngularVelocity'
    tube1Display.GaussianRadius = 0.0045062511471041945
    tube1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    tube1Display.ScaleTransferFunction = 'PiecewiseFunction'
    tube1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    tube1Display.OpacityTransferFunction = 'PiecewiseFunction'
    tube1Display.DataAxesGrid = 'GridAxesRepresentation'
    tube1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    tube1Display.ScaleTransferFunction.Points = [-6.605447513712243, 0.0, 0.5, 0.0, 7.437162085145272, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    tube1Display.OpacityTransferFunction.Points = [-6.605447513712243, 0.0, 0.5, 0.0, 7.437162085145272, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Threshold'
    threshold1 = Threshold(Input=tube1)
    threshold1.Scalars = ['POINTS', 'AngularVelocity']
    threshold1.ThresholdRange = [-6.605447513712243, 7.437162085145272]

    # Properties modified on threshold1
    threshold1.ThresholdRange = [-5.0, 7.437162085145272]

    # show data in view
    threshold1Display = Show(threshold1, renderView1)

    # trace defaults for the display properties.
    threshold1Display.Representation = 'Surface'
    threshold1Display.ColorArrayName = [None, '']
    threshold1Display.OSPRayScaleArray = 'AngularVelocity'
    threshold1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    threshold1Display.SelectOrientationVectors = 'Normals'
    threshold1Display.ScaleFactor = 0.09008695345546586
    threshold1Display.SelectScaleArray = 'AngularVelocity'
    threshold1Display.GlyphType = 'Arrow'
    threshold1Display.GlyphTableIndexArray = 'AngularVelocity'
    threshold1Display.GaussianRadius = 0.0045043476727732925
    threshold1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    threshold1Display.ScaleTransferFunction = 'PiecewiseFunction'
    threshold1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    threshold1Display.OpacityTransferFunction = 'PiecewiseFunction'
    threshold1Display.DataAxesGrid = 'GridAxesRepresentation'
    threshold1Display.PolarAxes = 'PolarAxesRepresentation'
    threshold1Display.ScalarOpacityUnitDistance = 0.07035014604038363

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    threshold1Display.ScaleTransferFunction.Points = [-4.771098305398063, 0.0, 0.5, 0.0, 7.437162085145271, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    threshold1Display.OpacityTransferFunction.Points = [-4.771098305398063, 0.0, 0.5, 0.0, 7.437162085145271, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(tube1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # save data
    SaveData('/Users/yy/Desktop/local_vtk_folder/temp_force_2_pp_10000/' + day_str + '_2.vtk', proxy=threshold1, FileType='Ascii')

    # set active source
    SetActiveSource(tube1)

    # hide data in view
    Hide(threshold1, renderView1)

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # destroy threshold1
    Delete(threshold1)
    del threshold1

    # set active source
    SetActiveSource(streamTracerWithCustomSource1)

    # hide data in view
    Hide(tube1, renderView1)

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # destroy tube1
    Delete(tube1)
    del tube1

    # set active source
    SetActiveSource(extractSubset1)

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # destroy streamTracerWithCustomSource1
    Delete(streamTracerWithCustomSource1)
    del streamTracerWithCustomSource1

    # set active source
    SetActiveSource(vec0vtk)

    # hide data in view
    Hide(extractSubset1, renderView1)

    # show data in view
    vec0vtkDisplay = Show(vec0vtk, renderView1)

    # destroy extractSubset1
    Delete(extractSubset1)
    del extractSubset1

    # create a new 'Extract Subset'
    extractSubset1 = ExtractSubset(Input=vec0vtk)
    extractSubset1.VOI = [0, 499, 0, 499, 0, 49]

    # Properties modified on extractSubset1
    extractSubset1.VOI = [125, 375, 125, 375, 0, 49]

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # trace defaults for the display properties.
    extractSubset1Display.Representation = 'Outline'
    extractSubset1Display.ColorArrayName = [None, '']
    extractSubset1Display.OSPRayScaleArray = 'vectors'
    extractSubset1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    extractSubset1Display.SelectOrientationVectors = 'vectors'
    extractSubset1Display.ScaleFactor = 0.09800000190734864
    extractSubset1Display.SelectScaleArray = 'None'
    extractSubset1Display.GlyphType = 'Arrow'
    extractSubset1Display.GlyphTableIndexArray = 'None'
    extractSubset1Display.GaussianRadius = 0.004900000095367432
    extractSubset1Display.SetScaleArray = ['POINTS', 'vectors']
    extractSubset1Display.ScaleTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.OpacityArray = ['POINTS', 'vectors']
    extractSubset1Display.OpacityTransferFunction = 'PiecewiseFunction'
    extractSubset1Display.DataAxesGrid = 'GridAxesRepresentation'
    extractSubset1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    extractSubset1Display.ScaleTransferFunction.Points = [-0.4467490017414093, 0.0, 0.5, 0.0, 0.4345960021018982, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    extractSubset1Display.OpacityTransferFunction.Points = [-0.4467490017414093, 0.0, 0.5, 0.0, 0.4345960021018982, 1.0, 0.5, 0.0]

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Stream Tracer With Custom Source'
    streamTracerWithCustomSource1 = StreamTracerWithCustomSource(Input=extractSubset1,
        SeedSource=points0vtk)
    streamTracerWithCustomSource1.Vectors = ['POINTS', 'vectors']
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.9800000190734863

    # Properties modified on streamTracerWithCustomSource1
    streamTracerWithCustomSource1.IntegrationDirection = 'BACKWARD'
    streamTracerWithCustomSource1.InitialStepLength = 1.0
    streamTracerWithCustomSource1.MinimumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStepLength = 1.0
    streamTracerWithCustomSource1.MaximumStreamlineLength = 0.5

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # trace defaults for the display properties.
    streamTracerWithCustomSource1Display.Representation = 'Surface'
    streamTracerWithCustomSource1Display.ColorArrayName = [None, '']
    streamTracerWithCustomSource1Display.OSPRayScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.SelectOrientationVectors = 'Normals'
    streamTracerWithCustomSource1Display.ScaleFactor = 0.08406995534896851
    streamTracerWithCustomSource1Display.SelectScaleArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GlyphType = 'Arrow'
    streamTracerWithCustomSource1Display.GlyphTableIndexArray = 'AngularVelocity'
    streamTracerWithCustomSource1Display.GaussianRadius = 0.004203497767448426
    streamTracerWithCustomSource1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.ScaleTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    streamTracerWithCustomSource1Display.OpacityTransferFunction = 'PiecewiseFunction'
    streamTracerWithCustomSource1Display.DataAxesGrid = 'GridAxesRepresentation'
    streamTracerWithCustomSource1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    streamTracerWithCustomSource1Display.ScaleTransferFunction.Points = [-6.513661385102449, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    streamTracerWithCustomSource1Display.OpacityTransferFunction.Points = [-6.513661385102449, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(points0vtk, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Tube'
    tube1 = Tube(Input=streamTracerWithCustomSource1)
    tube1.Scalars = ['POINTS', 'AngularVelocity']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.008406995534896851

    # Properties modified on tube1
    tube1.Radius = 0.0005

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # trace defaults for the display properties.
    tube1Display.Representation = 'Surface'
    tube1Display.ColorArrayName = [None, '']
    tube1Display.OSPRayScaleArray = 'AngularVelocity'
    tube1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    tube1Display.SelectOrientationVectors = 'Normals'
    tube1Display.ScaleFactor = 0.08411325729393866
    tube1Display.SelectScaleArray = 'AngularVelocity'
    tube1Display.GlyphType = 'Arrow'
    tube1Display.GlyphTableIndexArray = 'AngularVelocity'
    tube1Display.GaussianRadius = 0.004205662864696933
    tube1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    tube1Display.ScaleTransferFunction = 'PiecewiseFunction'
    tube1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    tube1Display.OpacityTransferFunction = 'PiecewiseFunction'
    tube1Display.DataAxesGrid = 'GridAxesRepresentation'
    tube1Display.PolarAxes = 'PolarAxesRepresentation'

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    tube1Display.ScaleTransferFunction.Points = [-6.513661385102449, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    tube1Display.OpacityTransferFunction.Points = [-6.513661385102449, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # create a new 'Threshold'
    threshold1 = Threshold(Input=tube1)
    threshold1.Scalars = ['POINTS', 'AngularVelocity']
    threshold1.ThresholdRange = [-6.513661385102449, 8.218573730273164]

    # Properties modified on threshold1
    threshold1.ThresholdRange = [-5.0, 8.218573730273164]

    # show data in view
    threshold1Display = Show(threshold1, renderView1)

    # trace defaults for the display properties.
    threshold1Display.Representation = 'Surface'
    threshold1Display.ColorArrayName = [None, '']
    threshold1Display.OSPRayScaleArray = 'AngularVelocity'
    threshold1Display.OSPRayScaleFunction = 'PiecewiseFunction'
    threshold1Display.SelectOrientationVectors = 'Normals'
    threshold1Display.ScaleFactor = 0.08209326184296516
    threshold1Display.SelectScaleArray = 'AngularVelocity'
    threshold1Display.GlyphType = 'Arrow'
    threshold1Display.GlyphTableIndexArray = 'AngularVelocity'
    threshold1Display.GaussianRadius = 0.0041046630921482575
    threshold1Display.SetScaleArray = ['POINTS', 'AngularVelocity']
    threshold1Display.ScaleTransferFunction = 'PiecewiseFunction'
    threshold1Display.OpacityArray = ['POINTS', 'AngularVelocity']
    threshold1Display.OpacityTransferFunction = 'PiecewiseFunction'
    threshold1Display.DataAxesGrid = 'GridAxesRepresentation'
    threshold1Display.PolarAxes = 'PolarAxesRepresentation'
    threshold1Display.ScalarOpacityUnitDistance = 0.07048528743524476

    # init the 'PiecewiseFunction' selected for 'ScaleTransferFunction'
    threshold1Display.ScaleTransferFunction.Points = [-4.789651654003343, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # init the 'PiecewiseFunction' selected for 'OpacityTransferFunction'
    threshold1Display.OpacityTransferFunction.Points = [-4.789651654003343, 0.0, 0.5, 0.0, 8.218573730273164, 1.0, 0.5, 0.0]

    # hide data in view
    Hide(tube1, renderView1)

    # update the view to ensure updated data information
    renderView1.Update()

    # save data
    SaveData('/Users/yy/Desktop/local_vtk_folder/temp_force_2_pp_10000/' + day_str + '_3.vtk', proxy=threshold1, FileType='Ascii')
    # set active source
    SetActiveSource(tube1)

    # hide data in view
    Hide(threshold1, renderView1)

    # show data in view
    tube1Display = Show(tube1, renderView1)

    # destroy threshold1
    Delete(threshold1)
    del threshold1

    # set active source
    SetActiveSource(streamTracerWithCustomSource1)

    # hide data in view
    Hide(tube1, renderView1)

    # show data in view
    streamTracerWithCustomSource1Display = Show(streamTracerWithCustomSource1, renderView1)

    # destroy tube1
    Delete(tube1)
    del tube1

    # set active source
    SetActiveSource(extractSubset1)

    # hide data in view
    Hide(streamTracerWithCustomSource1, renderView1)

    # show data in view
    extractSubset1Display = Show(extractSubset1, renderView1)

    # destroy streamTracerWithCustomSource1
    Delete(streamTracerWithCustomSource1)
    del streamTracerWithCustomSource1

    # set active source
    SetActiveSource(vec0vtk)

    # hide data in view
    Hide(extractSubset1, renderView1)

    # show data in view
    vec0vtkDisplay = Show(vec0vtk, renderView1)

    # destroy extractSubset1
    Delete(extractSubset1)
    del extractSubset1

    # destroy vec0vtk
    Delete(vec0vtk)
    del vec0vtk

    # set active source
    SetActiveSource(points0vtk)

    # destroy points0vtk
    Delete(points0vtk)
    del points0vtk

    #### saving camera placements for all active views

    # current camera placement for renderView1
    renderView1.CameraPosition = [0.9387068278657672, 1.468109930752684, -1.5119272616908974]
    renderView1.CameraFocalPoint = [0.49900001287460233, 0.49900001287460405, 0.4900000095367443]
    renderView1.CameraViewUp = [-0.5435106726401868, -0.7024977237423209, -0.45944868795445426]
    renderView1.CameraParallelScale = 0.8591286487154975

    #### uncomment the following to render all views
    # RenderAllViews()
    # alternatively, if you want to write images, you can use SaveScreenshot(...).
