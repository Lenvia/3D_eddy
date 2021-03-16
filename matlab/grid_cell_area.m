function [dx,dy, A] = grid_cell_area(x,y)
    [nx, ny] = size(x);
    dx = zeros(nx, ny);
    dy = zeros(nx, ny);

    for j=1:ny
        dx(1,j) = x(2,j)-x(1,j);
        for i=2:nx-1
            dx(i,j) = (x(i+1,j) - x(i-1, j))/2.0;
        end
        dx(nx, j) = x(nx, j) - x(nx-1, j);
    end
    
    for i=1:nx
        dy(i,1) = y(i,2) - y(i, 1);
        for j=2:ny-1
            dy(i,j) = (y(i,j+1) - y(i, j-1))/2.0;
        end
        dy(i, ny) = y(i, ny) - y(i, ny-1);
    end
    
    A = dx.*dy;
end

