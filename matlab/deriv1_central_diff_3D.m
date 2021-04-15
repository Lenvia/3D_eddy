function [dadx, dady] = deriv1_central_diff_3D(a,x,y)
    [nx, ny, nz] = size(a);
    dadx = zeros(nx, ny, nz);
    dady = zeros(nx, ny, nz);
    
    for k=1:nz
        for j=1:ny
            dadx(1,j,k) = (a(2,j,k)-a(1,j,k)) / (x(2,j) - x(1,j));
            for i=2:nx-1
                dadx(i,j,k) = (a(i+1,j,k)-a(i-1,j,k))/(x(i+1,j)-x(i-1,j));
            end
            dadx(nx,j,k) = (a(nx,j,k)-a(nx-1,j,k))/(x(nx,j)-x(nx-1,j));
        end
        
        for i=1:nx
            dady(i,1,k) = (a(i,2,k)-a(i,1,k)) / (y(i,2) - y(i,1));
            for j=2:ny-1
                dady(i,j,k) = (a(i,j+1,k)-a(i,j-1,k))/(y(i,j+1)-y(i,j-1));
            end
            dady(i,ny,k) = (a(i,ny,k)-a(i,ny-1,k))/(y(i,ny)-y(i,ny-1));
        end
    end
end

