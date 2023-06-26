namespace MultiArchApp.Models;

public class IndexModel
{
    public string OSDescription { get; set; }
    public string OSArchitecture { get; set; }

    public IndexModel(string osDescription, string osArchitecture)
    {
      this.OSDescription = osDescription;
      this.OSArchitecture = osArchitecture;
    }
}
