using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNet.Mvc;
using Microsoft.Dnx.Runtime;

namespace MarioKartWiiTrackPicker.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly IApplicationEnvironment _appEnvironment;

        public HomeController(IApplicationEnvironment appEnvironment)
        {
            _appEnvironment = appEnvironment;
        }


        public IActionResult Index()
        {
            // Todo: fix dynamic image preloading on azure
            // var imagesSources = GetPreloadImageSourcePaths();
            // return View(imagesSources);
            return View(PreloadImages.ImageSourcePaths);
        }

        public IActionResult Error()
        {
            return View("~/Views/Shared/Error.cshtml");
        }

        private IEnumerable<string> GetPreloadImageSourcePaths()
        {
            var wwwrootFolderPath = Path.Combine(_appEnvironment.ApplicationBasePath, "wwwroot");
            var imagesFolderPath = Path.Combine(wwwrootFolderPath, "images");
            var cupsFolderPath = Path.Combine(imagesFolderPath, "cups");
            var cupTitlesFolderPath = Path.Combine(imagesFolderPath, "cup-titles");
            var trackTitlesFolderPath = Path.Combine(imagesFolderPath, "track-titles");
            var absoluteImageFilePaths = new[] {cupsFolderPath, cupTitlesFolderPath, trackTitlesFolderPath}
                .SelectMany(path => Directory.EnumerateFiles(path, "*.png", SearchOption.AllDirectories));
            var wwwrootFolderPathLength = wwwrootFolderPath.Length;
            return
                absoluteImageFilePaths.Select(
                    path => path.Substring(wwwrootFolderPathLength).Replace(@"\", "/"));
        }
    }
}
