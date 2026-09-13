FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY apps/api/src/KubikPortal.Api/KubikPortal.Api.csproj apps/api/src/KubikPortal.Api/
RUN dotnet restore apps/api/src/KubikPortal.Api/KubikPortal.Api.csproj
COPY apps/api/src/KubikPortal.Api/ apps/api/src/KubikPortal.Api/
RUN dotnet publish apps/api/src/KubikPortal.Api/KubikPortal.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "KubikPortal.Api.dll"]
